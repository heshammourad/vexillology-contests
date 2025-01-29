const { isBefore, isFuture, isPast } = require('date-fns');
const { keyBy } = require('lodash');
const numeral = require('numeral');
const { v4: uuidv4 } = require('uuid');

const { getVoteDates, getCategories } = require('../../db/queries');
const { IGNORE_PENDING_DEV } = require('../../env');
const { createLogger } = require('../../logger');

const db = require('./db');
const reddit = require('./reddit');

const logger = createLogger('API/CONTEST');

const CONTESTS_AVERAGE_FORMAT = '0.000';

const addCategoriesToEntries = async (contestId, entries) => {
  const entryCategories = await db.getContestEntryCategories(contestId);
  const map = new Map();
  entries.forEach((entry) => {
    map.set(entry.imgurId ?? entry.id, entry);
  });
  entryCategories
    .filter(({ entryId }) => Array.from(map.keys()).includes(entryId))
    .forEach(({ entryId, category }) => {
      map.set(entryId, { ...map.get(entryId), category });
    });
  return Array.from(map.values());
};

const addRanksToEntries = async (contestId, entries) => {
  let voteData = await db.getContestVotes(contestId);
  if (!voteData.length) {
    await db.refreshContestsSummaryView();
    voteData = await db.getContestVotes(contestId);
  }

  const map = new Map();
  voteData.forEach(({
    average, categoryRank, entryId, rank,
  }) => {
    map.set(entryId, {
      average: numeral(average).format(CONTESTS_AVERAGE_FORMAT),
      categoryRank,
      rank,
    });
  });
  entries.forEach((entry) => {
    const entryId = entry.imgurId ?? entry.id;
    map.set(entryId, { ...entry, ...map.get(entryId) });
  });
  return Array.from(map.values()).sort((a, b) => a.rank - b.rank);
};

const addUserVotesToEntries = async (contestId, username, entries) => {
  logger.debug(
    `Auth tokens present, retrieving votes of ${username} on ${contestId}`,
  );
  const votes = await db.getUserVotes(contestId, username);
  logger.debug(`${username} votes on ${contestId}: '${JSON.stringify(votes)}'`);

  const entriesObj = keyBy(entries, entries[0]?.imgurId ? 'imgurId' : 'id');
  votes.forEach(({ entryId, rating }) => {
    if (!entriesObj[entryId]) {
      return;
    }
    entriesObj[entryId].rating = rating;
  });
  return Object.values(entriesObj);
};

const sortEntriesRandomly = (entries, username) => {
  /**
   * Reproducible yet random hash function
   * Concatenates username and entryId for distinct hash
   * @param {string} entryId
   * @returns {int}
   */
  const getHash = (entryId) => {
    const seed = username + entryId;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      // eslint-disable-next-line no-bitwise
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  return entries
    .map(({ rank, user, ...entry }) => entry)
    .sort((a, b) => {
      if (a.rating > -1 && b.rating === undefined) {
        return 1;
      }
      if (b.rating > -1 && a.rating === undefined) {
        return -1;
      }
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return getHash(b.id) - getHash(a.id);
    });
};

exports.get = async ({ params: { contestId }, username }, res) => {
  try {
    const [contest] = await db.getContest(contestId);
    if (!contest) {
      logger.warn(`Contest id: ${contestId} not found in database.`);
      res.status(404).send();
      return;
    }

    const {
      date,
      localVoting,
      name,
      prompt,
      submissionEnd,
      submissionStart,
      subtext,
      validRedditId,
      winnersThreadId,
    } = contest;

    let response = {
      date: date.toJSON().substr(0, 10),
      isContestMode: false,
      localVoting,
      name,
      prompt,
      requestId: uuidv4(),
      submissionEnd,
      submissionStart,
      subtext,
      validRedditId,
      winnersThreadId,
    };

    // Check if this is a reddit contest, i.e. legacy contest
    if (validRedditId) {
      const redditContest = await reddit.getContest(contestId, winnersThreadId);
      if (!redditContest.entries.length) {
        logger.warn(`Unable to retrieve entries for contest: '${contestId}'`);
        res.status(404).send();
        return;
      }

      response = { ...response, ...redditContest };
    }

    const [{ now, voteStart, voteEnd }] = await getVoteDates(contestId);
    if (voteStart && voteEnd) {
      response.isContestMode = isBefore(now, voteEnd);
      response.voteStart = voteStart;
      response.voteEnd = voteEnd;
    }

    if (submissionStart) {
      if (isFuture(submissionStart)) {
        // Contest hasn't started yet
        res.status(404).send(contestId === 'dev' ? { name } : {});
        return;
      }

      if (isFuture(submissionEnd)) {
        // Contest is in submission phase
        res.send({ submissionWindowOpen: true, name });
        return;
      }

      const votingNotOpenResponse = {
        name: response.name,
        votingWindowOpen: false,
      };
      if (isFuture(voteStart)) {
        // Contest voting window hasn't opened yet
        res.send(votingNotOpenResponse);
        return;
      }

      const pendingEntries = await db.getContestEntriesBySubmissionStatus(
        contestId,
        'pending',
      );
      if (pendingEntries.length && !IGNORE_PENDING_DEV) {
        // Contest voting window is open but there are pending entries
        res.send(votingNotOpenResponse);
        return;
      }

      const fields = [
        'ce.category',
        'e.background_color',
        'e.description',
        'e.height',
        'e.id',
        "'/i/' || e.id || '.png' AS image_path",
        'e.markdown',
        'e.name',
        'e.width',
      ];
      if (isPast(voteEnd)) {
        fields.push('e.user');
      }
      response.entries = await db.getContestEntriesBySubmissionStatus(
        contestId,
        'approved',
        fields,
      );
    }

    // Load contest categories
    const categories = await getCategories(contestId);
    if (categories.length) {
      response.categories = categories;
      response.entries = await addCategoriesToEntries(
        contestId,
        response.entries,
      );
    }

    // Load user votes
    if (username) {
      response.entries = await addUserVotesToEntries(
        contestId,
        username,
        response.entries,
      );
    }

    if (response.isContestMode && !winnersThreadId) {
      // Randomly sort entries during contest mode
      response.entries = sortEntriesRandomly(response.entries, username);
    } else if (localVoting) {
      // Add ranks to entries when local voting is enabled
      response.entries = await addRanksToEntries(contestId, response.entries);
    }

    res.send(response);
  } catch (err) {
    logger.error(`Error getting /contest/${contestId}: ${err}`);
    res.status(500).send();
  }
};
