/**
 * Get contest detail
 * FROM DATABASE: results and voting dates
 * FROM REDDIT: only applied to older contests before migration
 */

const { isBefore, isFuture, isPast } = require('date-fns');
const keyBy = require('lodash/keyBy');
const partition = require('lodash/partition');
const numeral = require('numeral');
const { v4: uuidv4 } = require('uuid');

const db = require('../db');
const { getCategories, getVoteDates } = require('../db/queries');
const { CONTEST_ENV_LEVEL } = require('../env');
const imgur = require('../imgur');
const { createLogger } = require('../logger');
const memcache = require('../memcache');
const reddit = require('../reddit');
const { generateImagePath } = require('../util');

const logger = createLogger('API/CONTEST');

const LAST_WINNER_RANK = 20;
const CONTESTS_AVERAGE_FORMAT = '0.000';
const CONTESTS_CACHE_TIMEOUT = 3600;

const filterRepeatedIds = async (data, idField) => {
  const ids = new Set();
  const filteredData = [];
  const repeatedIds = [];
  data.forEach((datum) => {
    const id = datum[idField];
    if (ids.has(id)) {
      repeatedIds.push(id);
    } else {
      filteredData.push(datum);
    }
    ids.add(id);
  });
  return { filteredData, repeatedIds };
};

const addContestEntries = async (contestId, entries) => {
  const { filteredData, repeatedIds } = await filterRepeatedIds(entries, 'id');
  if (repeatedIds.length) {
    logger.warn(`Error adding contest entries. Repeated ids: ${repeatedIds.join(', ')}`);
  }
  await db.insert(
    'contest_entries',
    filteredData.map((entry) => ({
      contest_id: contestId,
      entry_id: entry.id,
      rank: entry.rank,
    })),
  );
};

const addEntries = async (entries) => {
  const { filteredData, repeatedIds } = await filterRepeatedIds(entries, 'id');
  if (repeatedIds.length) {
    logger.warn(`Error adding entries. Repeated ids: ${repeatedIds.join(', ')}`);
  }
  await db.insert('entries', filteredData);
};

// eslint-disable-next-line max-len
const findMissingEntries = (contest, imagesData) => contest.entries.filter((entry) => !imagesData.find((image) => image.id === entry.imgurId));

exports.get = async ({ params: { id }, username }, res) => {
  try {
    const contestResults = await db.select(
      `SELECT
         date,
         local_voting,
         name,
         submission_end,
         submission_start,
         subtext,
         valid_reddit_id,
         winners_thread_id
       FROM contests
       WHERE id = $1 AND env_level >= $2`,
      [id, CONTEST_ENV_LEVEL],
    );
    if (!contestResults.length) {
      logger.warn(`Contest id: ${id} not found in database.`);
      res.status(404).send();
      return;
    }

    const {
      date,
      localVoting,
      name,
      submissionEnd,
      submissionStart,
      subtext,
      validRedditId,
      winnersThreadId,
    } = contestResults[0];

    let response = {
      date: date.toJSON().substr(0, 10),
      isContestMode: false,
      localVoting,
      name,
      requestId: uuidv4(),
      submissionEnd,
      submissionStart,
      subtext,
      validRedditId,
      winnersThreadId,
    };

    if (validRedditId) {
      const contest = await memcache.get(
        `reddit.${id}`,
        async () => {
          const contestData = await reddit.getContest(id);
          return contestData;
        },
        600,
      );

      const imagesData = await db.select(
        `SELECT *
      FROM entries e
      JOIN contest_entries ce
        ON e.id = ce.entry_id
      WHERE contest_id = $1`,
        [id],
      );

      const contestEntriesData = [];
      if (winnersThreadId) {
        // Top 20
        const contestWinners = imagesData.filter(
          (image) => image.rank && image.rank <= LAST_WINNER_RANK,
        );
        const winner = contestWinners.find(({ rank }) => rank === 1);
        if (contestWinners.length < LAST_WINNER_RANK || !winner.description) {
          const winners = await memcache.get(
            `reddit.${winnersThreadId}`,
            async () => {
              const winnerData = await reddit.getWinners(winnersThreadId);
              return winnerData;
            },
            CONTESTS_CACHE_TIMEOUT,
          );

          const entriesData = [];
          winners.forEach(({ imgurId, rank, user }) => {
            contestEntriesData.push({
              contest_id: id,
              entry_id: imgurId,
              rank,
            });

            const imageData = imagesData.find((image) => image.id === imgurId);
            if (imageData) {
              imageData.rank = rank;
              imageData.user = user;

              const { description, name: entryName } = contest.entries.find(
                (entry) => entry.imgurId === imgurId,
              );
              entriesData.push({
                description,
                id: imgurId,
                name: entryName,
                user,
              });
            }
          });

          if (entriesData.length) {
            await db.update('contest_entries', contestEntriesData, [
              '?contest_id',
              '?entry_id',
              'rank',
            ]);
            await db.update('entries', entriesData, ['?id', 'description', 'name', 'user']);
          }
        }
      }

      const getEntryRank = (entryId) => {
        const contestEntry = contestEntriesData.find((entry) => entry.entry_id === entryId);
        if (contestEntry) {
          return contestEntry.rank;
        }
        return null;
      };

      const allImagesData = [...imagesData];
      let missingEntries = findMissingEntries(contest, allImagesData);
      if (missingEntries.length) {
        const entriesData = await db.select('SELECT * FROM entries WHERE id = ANY ($1)', [
          missingEntries.map((entry) => entry.imgurId),
        ]);
        const contestEntries = entriesData.map((entry) => ({
          ...entry,
          rank: getEntryRank(entry.id),
        }));
        if (entriesData.length) {
          await addContestEntries(id, contestEntries);
          allImagesData.push(...contestEntries);
        }
      }

      missingEntries = findMissingEntries(contest, allImagesData);
      if (missingEntries.length) {
        const imgurData = (await imgur.getImagesData(missingEntries)).map(
          ({ imgurId, height, width }) => ({
            id: imgurId,
            height,
            width,
          }),
        );
        if (imgurData.length) {
          await addEntries(imgurData);
          const contestEntries = imgurData.map((imageData) => ({
            ...imageData,
            rank: getEntryRank(imageData.id),
          }));
          await addContestEntries(id, contestEntries);
          allImagesData.push(...contestEntries);
        }
      }

      missingEntries = findMissingEntries(contest, allImagesData);
      if (missingEntries.length) {
        logger.warn(
          `Unable to retrieve image data for: [${missingEntries
            .map(({ imgurId }) => imgurId)
            .join(', ')}] in contest ${id}.`,
        );
      }

      contest.entries = contest.entries.reduce((acc, cur) => {
        const imageData = allImagesData.find((image) => cur.imgurId === image.id);
        if (imageData) {
          const {
            id: imgurId, height, rank, width, user,
          } = imageData;
          acc.push({
            ...cur,
            imagePath: generateImagePath(imgurId),
            imgurId,
            height,
            rank,
            width,
            user,
          });
        }
        return acc;
      }, []);

      if (!contest.entries.length) {
        logger.warn(`Unable to retrieve entries for contest: '${id}'`);
        res.status(404).send();
        return;
      }

      response = { ...response, ...contest };

      try {
        const updateData = response.entries.map(({ description, imgurId, name: entryName }) => ({
          description,
          id: imgurId,
          name: entryName,
        }));
        db.update('entries', updateData, ['?id', 'description', 'name']);
      } catch (err) {
        logger.error(`Unable to update db: ${err}`);
      }
    }

    const [{ now, voteStart, voteEnd }] = await getVoteDates(id);
    if (voteStart && voteEnd) {
      response.isContestMode = isBefore(now, voteEnd);
      response.voteStart = voteStart;
      response.voteEnd = voteEnd;
    }

    if (submissionStart) {
      if (isFuture(submissionStart)) {
        res.status(404).send();
        return;
      }

      if (isFuture(submissionEnd)) {
        res.send({ submissionWindowOpen: true });
        return;
      }

      const queryEntries = async (selectExpression, submissionStatus) => db.select(
        `SELECT ${selectExpression}
         FROM contest_entries ce, entries e
         WHERE ce.entry_id = e.id AND ce.contest_id = $1 AND e.submission_status = $2`,
        [id, submissionStatus],
      );

      const votingNotOpenResponse = { name: response.name, votingWindowOpen: false };
      if (isFuture(voteStart)) {
        res.send(votingNotOpenResponse);
        return;
      }

      const pendingEntries = await queryEntries('*', 'pending');
      if (pendingEntries.length) {
        res.send(votingNotOpenResponse);
        return;
      }

      response.entries = await queryEntries(
        `ce.category,
         e.description,
         e.height,
         e.id,
         '/i/' || e.id || '.png' AS image_path,
         e.markdown,
         e.name,
         ${isPast(voteEnd) ? 'e.user,' : ''}
         e.width`,
        'approved',
      );
    }

    const categories = await getCategories(id);
    if (categories.length) {
      response.categories = categories;
      const entryCategories = await db.select(
        'SELECT entry_id, category FROM contest_entries WHERE contest_id = $1',
        [id],
      );
      const map = new Map();
      response.entries.forEach((entry) => {
        map.set(entry.imgurId ?? entry.id, entry);
      });
      entryCategories
        .filter(({ entryId }) => Array.from(map.keys()).includes(entryId))
        .forEach(({ category, entryId }) => {
          map.set(entryId, { ...map.get(entryId), category });
        });
      response.entries = Array.from(map.values());
    }

    if (username) {
      logger.debug(`Auth tokens present, retrieving votes of ${username} on ${id}`);
      const votes = await db.select(
        'SELECT entry_id, rating FROM votes WHERE contest_id = $1 AND username = $2',
        [id, username],
      );
      logger.debug(`${username} votes on ${id}: '${JSON.stringify(votes)}'`);

      const entriesObj = keyBy(response.entries, response.entries[0].imgurId ? 'imgurId' : 'id');
      votes.forEach(({ entryId, rating }) => {
        if (!entriesObj[entryId]) {
          return;
        }
        entriesObj[entryId].rating = rating;
      });
      response.entries = Object.values(entriesObj);
      logger.debug(`Merged data: '${JSON.stringify(response.entries)}'`);
    }

    if (response.isContestMode && !winnersThreadId) {
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

      response.entries = response.entries.map(({ rank, user, ...entry }) => entry).sort(
        (a, b) => {
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
        },
      );
    } else if (localVoting) {
      const voteData = await db.select(
        `SELECT entry_id, rank, category_rank, average
         FROM contests_summary cs, entries e
         WHERE cs.entry_id = e.id AND e.submission_status = 'approved' AND contest_id = $1`,
        [id],
      );
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
      response.entries.forEach((entry) => {
        const entryId = entry.imgurId ?? entry.id;
        map.set(entryId, {
          ...entry,
          ...map.get(entryId),
        });
      });
      response.entries = Array.from(map.values()).sort((a, b) => a.rank - b.rank);
    } else {
      const [winners, entries] = partition(
        response.entries,
        ({ rank }) => rank && rank <= LAST_WINNER_RANK,
      );
      response.entries = entries.map(({ rank, user, ...entry }) => entry);
      if (winners.length) {
        response.winners = winners.sort((a, b) => a.rank - b.rank);
      }
    }

    res.send(response);
  } catch (err) {
    logger.error(`Error getting /contest/${id}: ${err}`);
    res.status(500).send();
  }
};
