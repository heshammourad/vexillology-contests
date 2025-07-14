/**
 * @file Retrieves contest data
 *  - FROM DATABASE: results and voting dates
 *  - FROM REDDIT: only applied to older contests before migration
 */

const { isFuture } = require('date-fns');
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

/**
 * Adds categories to contest entries.
 *
 * @param {string} contestId - The ID of the contest.
 * @param {Array<Object>} entries - The list of contest entries.
 * @returns {Promise<Array<Object>>} A promise that resolves to the list of contest entries
 * with categories added.
 */
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

/**
 * Adds ranks to contest entries based on vote data.
 *
 * @param {string} contestId - The ID of the contest.
 * @param {Array<Object>} entries - The list of contest entries.
 * @returns {Promise<Array<Object>>} A promise that resolves to a sorted array of entries
 * with added rank information.
 */
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

/**
 * Adds user votes to contest entries.
 *
 * @param {string} contestId - The ID of the contest.
 * @param {string} username - The username of the user.
 * @param {Array<Object>} entries - The list of contest entries.
 * @returns {Promise<Array<Object>>} The list of contest entries with user votes added.
 */
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

/**
 * Sorts contest entries randomly but reproducibly based on a username.
 * Entries are sorted by rating first, then by a reproducible hash.
 *
 * @param {Array<Object>} entries - The list of contest entries to sort.
 * @param {string} username - The username used to generate reproducible randomness.
 * @returns {Array<Object>} - The sorted list of contest entries.
 */
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
      contestStatus: 'NOT_STARTED',
      date: date.toJSON().substr(0, 10),
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

    const [{ voteStart, voteEnd }] = await getVoteDates(contestId);
    if (voteStart && voteEnd) {
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
        response.contestStatus = 'SUBMISSIONS_OPEN';
        res.send({ contestStatus: response.contestStatus, name });
        return;
      }

      if (isFuture(voteStart)) {
        // Contest voting window hasn't opened yet
        response.contestStatus = 'SUBMISSIONS_CLOSED';
        res.send({ contestStatus: response.contestStatus, name });
        return;
      }

      const pendingEntries = await db.getContestEntriesBySubmissionStatus(
        contestId,
        'pending',
      );
      if (pendingEntries.length && !IGNORE_PENDING_DEV) {
        // Contest voting window is open but there are pending entries
        response.contestStatus = 'SUBMISSIONS_CLOSED';
        res.send({ contestStatus: response.contestStatus, name });
        return;
      }

      if (isFuture(voteEnd)) {
        response.contestStatus = 'VOTING_OPEN';
      } else {
        response.contestStatus = contest.resultsCertified
          ? 'RESULTS_CERTIFIED'
          : 'VOTING_CLOSED';
      }
    }

    if (response.contestStatus === 'VOTING_CLOSED') {
      res.send({ contestStatus: response.contestStatus, name });
      return;
    }

    const fields = [
      'e.background_color',
      'e.description',
      'e.height',
      'e.id',
      "'/i/' || e.id || '.png' AS image_path",
      'e.markdown',
      'e.name',
      'e.width',
    ];
    if (response.contestStatus === 'RESULTS_CERTIFIED') {
      fields.push('e.user');
    }
    response.entries = await db.getContestEntriesBySubmissionStatus(
      contestId,
      'approved',
      fields,
    );

    // Load contest categories
    const categories = await getCategories(contestId);
    if (categories.length) {
      response.categories = categories;
      response.entries = await addCategoriesToEntries(
        contestId,
        response.entries,
      );
    }

    if (username) {
      // If logged in user, add their ratings to the entries
      response.entries = await addUserVotesToEntries(
        contestId,
        username,
        response.entries,
      );
    }

    if (response.contestStatus === 'VOTING_OPEN' && !winnersThreadId) {
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
