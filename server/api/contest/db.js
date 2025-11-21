/**
 * @file Exposes functions for interacting with the database for contest-related operations.
 */

const db = require('../../db');
const { CONTEST_ENV_LEVEL } = require('../../env');
const { createLogger } = require('../../logger');

const logger = createLogger('API/CONTEST/DB');

/**
 * Partitions out objects with repeated IDs from the provided data array.
 *
 * @param {Array<Object>} data - The array of objects to filter.
 * @param {string} idField - The field name of the ID to check for repetition.
 * @returns {Object} An object containing two properties:
 *   - filteredData: An array of objects with unique IDs.
 *   - repeatedIds: An array of IDs that were found to be repeated.
 */
const filterRepeatedIds = (data, idField) => {
  const ids = [];
  const filteredData = [];
  const repeatedIds = [];
  data.forEach((datum) => {
    const id = datum[idField];
    if (ids.includes(id)) {
      repeatedIds.push(id);
    } else {
      filteredData.push(datum);
      ids.push(id);
    }
  });
  return { filteredData, repeatedIds };
};

/**
 * Adds contest entries to the database.
 *
 * @param {number} contestId - The ID of the contest.
 * @param {Array<Object>} entries - The entries to add to the contest.
 * @returns {Promise<void>}
 */
exports.addContestEntries = async (contestId, entries) => {
  const { filteredData, repeatedIds } = filterRepeatedIds(entries, 'id');
  if (repeatedIds.length) {
    logger.warn(
      `Error adding contest entries. Repeated ids: ${repeatedIds.join(', ')}`,
    );
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

/**
 * Adds entries to the database.
 *
 * @param {Array<Object>} entries - The entries to add.
 * @returns {Promise<void>}
 */
exports.addEntries = async (entries) => {
  const { filteredData, repeatedIds } = filterRepeatedIds(entries, 'id');
  if (repeatedIds.length) {
    logger.warn(
      `Error adding entries. Repeated ids: ${repeatedIds.join(', ')}`,
    );
  }
  await db.insert('entries', filteredData);
};

/**
 * Retrieves a contest from the database.
 *
 * @param {number} contestId - The ID of the contest to retrieve.
 * @returns {Promise<Object>} The contest data.
 */
exports.getContest = async (contestId) => db.select(
  `SELECT
    date,
    local_voting,
    name,
    prompt,
    results_certified,
    submission_end,
    submission_start,
    subtext,
    valid_reddit_id,
    winners_thread_id
  FROM contests
  WHERE id = $1 AND env_level >= $2`,
  [contestId, CONTEST_ENV_LEVEL],
);

/**
 * Retrieves entries for a specific contest from the database.
 *
 * @param {number} contestId - The ID of the contest.
 * @returns {Promise<Array<Object>>} The contest entries.
 */
exports.getContestEntries = async (contestId) => db.select(
  `SELECT *
  FROM entries e
  JOIN contest_entries ce
    on e.id = ce.entry_id
  WHERE ce.contest_id = $1`,
  [contestId],
);

/**
 * Retrieves contest entries by submission status.
 *
 * @param {number} contestId - The ID of the contest.
 * @param {string} submissionStatus - The submission status to filter by.
 * @param {Array<string>} [fields=['*']] - The fields to select.
 * @returns {Promise<Array<Object>>} The contest entries with the specified submission status.
 */
exports.getContestEntriesBySubmissionStatus = async (
  contestId,
  submissionStatus,
  fields = ['*'],
) => db.select(
  `SELECT ${fields.join(', ')}
    FROM entries e
    JOIN contest_entries ce
      on e.id = ce.entry_id
    WHERE ce.contest_id = $1 AND e.submission_status = $2`,
  [contestId, submissionStatus],
);

/**
 * Retrieves contest entry categories from the database.
 *
 * @param {number} contestId - The ID of the contest.
 * @returns {Promise<Array<Object>>} The contest entry categories.
 */
exports.getContestEntryCategories = async (contestId) => db.select(
  'SELECT entry_id, category FROM contest_entries WHERE contest_id = $1',
  [contestId],
);

/**
 * Retrieves contest votes from the database.
 *
 * @param {number} contestId - The ID of the contest.
 * @returns {Promise<Array<Object>>} The contest votes.
 */
exports.getContestVotes = async (contestId) => db.select(
  `SELECT entry_id, rank, category_rank, average
  FROM contests_summary cs
  LEFT JOIN entries e
    ON cs.entry_id = e.id
  WHERE submission_status = 'approved' AND contest_id = $1`,
  [contestId],
);

/**
 * Retrieves entries by their IDs from the database.
 *
 * @param {Array<number>} ids - The IDs of the entries to retrieve.
 * @returns {Promise<Array<Object>>} The entries with the specified IDs.
 */
exports.getEntriesByIds = async (ids) => db.select('SELECT * FROM entries WHERE id = ANY ($1)', [ids]);

/**
 * Retrieves user votes for a specific contest from the database.
 *
 * @param {number} contestId - The ID of the contest.
 * @param {string} username - The username of the user.
 * @returns {Promise<Array<Object>>} The user votes.
 */
exports.getUserVotes = async (contestId, username) => db.select(
  'SELECT entry_id, rating FROM votes WHERE contest_id = $1 AND username = $2',
  [contestId, username],
);

/**
 * Refreshes the contests summary materialized view.
 *
 * @returns {Promise<void>}
 */
exports.refreshContestsSummaryView = async () => db.any('REFRESH MATERIALIZED VIEW contests_summary');

/**
 * Updates contest entries in the database.
 *
 * @param {Array<Object>} contestEntries - The contest entries to update.
 * @param {Array<string>} fields - The fields to update.
 * @returns {Promise<void>}
 */
exports.updateContestEntries = async (contestEntries, fields) => db.update('contest_entries', contestEntries, fields);

/**
 * Updates entries in the database.
 *
 * @param {Array<Object>} entries - The entries to update.
 * @param {Array<string>} fields - The fields to update.
 * @returns {Promise<void>}
 */
exports.updateEntries = async (entries, fields) => db.update('entries', entries, fields);
