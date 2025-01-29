/**
 * @file Retrieves contest data for contests that were conducted on Reddit.
 */

const partition = require('lodash/partition');

const imgur = require('../../imgur');
const { createLogger } = require('../../logger');
const memcache = require('../../memcache');
const reddit = require('../../reddit');
const { generateImagePath } = require('../../util');

const db = require('./db');

const logger = createLogger('API/CONTEST/REDDIT');

const CONTESTS_CACHE_TIMEOUT = 600;
const LAST_WINNER_RANK = 20;
const WINNERS_CACHE_TIMEOUT = 3600;

/**
 * Finds and returns the entries in a contest that are missing corresponding images.
 *
 * @param {Object} contest - The contest object containing entries.
 * @param {Array} contest.entries - An array of contest entries.
 * @param {Object} contest.entries[].imgurId - The imgur ID of the contest entry.
 * @param {Array} imagesData - An array of image data objects.
 * @param {Object} imagesData[].id - The imgur ID of the image.
 * @returns {Array} An array of contest entries that do not have corresponding images.
 */
const findMissingEntries = (contest, imagesData) => contest.entries.filter(
  (entry) => !imagesData.find((image) => image.id === entry.imgurId),
);

/**
 * Retrieves contest data for a specific contest conducted on Reddit.
 *
 * @param {string} contestId - The ID of the contest to retrieve.
 * @param {string} [winnersThreadId] - The ID of the winners thread, if available.
 * @returns {Promise<Object>} The contest data, including entries and winners.
 */
exports.getContest = async (contestId, winnersThreadId) => {
  const contest = await memcache.get(
    `reddit.${contestId}`,
    async () => reddit.getContest(contestId),
    CONTESTS_CACHE_TIMEOUT,
  );

  const entries = await db.getContestEntries(contestId);

  const contestEntriesData = [];
  if (winnersThreadId) {
    // Process the Top 20
    const contestWinners = entries.filter(
      (entry) => entry?.rank <= LAST_WINNER_RANK,
    );
    const winner = contestWinners.find(({ rank }) => rank === 1);
    if (contestWinners.length < LAST_WINNER_RANK || !winner?.description) {
      // We haven't loaded the winners from the winners thread yet, so we need to fetch the results.
      const winners = await memcache.get(
        `reddit.${winnersThreadId}`,
        async () => reddit.getWinners(winnersThreadId),
        WINNERS_CACHE_TIMEOUT,
      );

      const entriesData = [];
      winners.forEach(({ imgurId, rank, user }) => {
        contestEntriesData.push({
          contest_id: contestId,
          entry_id: imgurId,
          rank,
        });

        const entry = entries.find((e) => e.id === imgurId);
        if (entry) {
          entry.rank = rank;
          entry.user = user;

          const { description, name } = contest.entries.find(
            (e) => e.imgurId === imgurId,
          );
          entriesData.push({
            description,
            id: imgurId,
            name,
            user,
          });
        }
      });

      if (entriesData.length) {
        await db.updateContestEntries(contestEntriesData, [
          '?contest_id',
          '?entry_id',
          'rank',
        ]);
        await db.updateEntries(entriesData, [
          '?id',
          'description',
          'name',
          'user',
        ]);
      }
    }
  }

  const getEntryRank = (entryId) => {
    const contestEntry = contestEntriesData.find(
      (entry) => entry.entry_id === entryId,
    );
    return contestEntry?.rank;
  };

  const allEntries = [...entries];
  let missingEntries = findMissingEntries(contest, allEntries);
  if (missingEntries.length) {
    const entriesData = await db.getEntriesByIds(
      missingEntries.map((entry) => entry.imgurId),
    );
    const contestEntries = entriesData.map((entry) => ({
      ...entry,
      rank: getEntryRank(entry.id),
    }));
    if (contestEntries.length) {
      await db.addContestEntries(contestId, contestEntries);
      allEntries.push(...contestEntries);
    }
  }

  missingEntries = findMissingEntries(contest, allEntries);
  if (missingEntries.length) {
    const imgurData = (await imgur.getImagesData(missingEntries)).map(
      ({ imgurId, height, width }) => ({
        id: imgurId,
        height,
        width,
      }),
    );
    if (imgurData.length) {
      await db.addEntries(imgurData);
      const contestEntries = imgurData.map((imageData) => ({
        ...imageData,
        rank: getEntryRank(imageData.id),
      }));
      await db.addContestEntries(contestId, contestEntries);
      allEntries.push(...contestEntries);
    }
  }

  missingEntries = findMissingEntries(contest, allEntries);
  if (missingEntries.length) {
    logger.warn(
      `Unable to retrieve image data for: [${missingEntries
        .map(({ imgurId }) => imgurId)
        .join(', ')}] in contest ${contestId}.`,
    );
  }

  const contestEntries = [];
  contest.entries.forEach((entry) => {
    const imageData = allEntries.find((e) => e.id === entry.imgurId);
    if (!imageData) {
      return;
    }
    const {
      id: imgurId, height, rank, user, width,
    } = imageData;
    contestEntries.push({
      ...entry,
      imagePath: generateImagePath(imgurId),
      imgurId,
      height,
      rank,
      width,
      user,
    });
  });
  const [winners, remainingEntries] = partition(
    contestEntries,
    ({ rank }) => rank && rank <= LAST_WINNER_RANK,
  );
  contest.entries = remainingEntries.map(({ rank, user, ...entry }) => entry);
  if (winners.length) {
    contest.winners = winners.sort((a, b) => a.rank - b.rank);
  }

  if (contestEntries.length) {
    const updateData = contestEntries.map(
      ({ description, imgurId, name: entryName }) => ({
        description,
        id: imgurId,
        name: entryName,
      }),
    );
    try {
      await db.updateEntries(updateData, ['?id', 'description', 'name']);
    } catch (err) {
      logger.error(`Unable to update db: ${err}`);
    }
  }

  return contest;
};
