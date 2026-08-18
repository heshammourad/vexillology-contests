/**
 * @exports addContest
 * @exports getCategories
 * @exports getCurrentContest
 * @exports getCurrentContestSubmissions
 * @exports getVoteDates
 * @exports refreshContestsSummaryView
 */

const { getContestId, getDefaultContestDates } = require('../contestSchedule');
const { ALLOW_DEV_CONTEST } = require('../env');
const { createLogger } = require('../logger');

const db = require('.');

const logger = createLogger('DB/QUERIES');

exports.getCategories = async (contestId) => {
  const categories = await db.select(
    'SELECT category FROM contest_categories WHERE contest_id = $1 ORDER BY sort_order, category',
    [contestId],
  );
  return categories.map(({ category }) => category);
};

exports.getCurrentContest = async () => {
  const [result] = await db.select(
    `SELECT
       id,
       name,
       prompt,
       results_certified,
       submission_start,
       submission_end,
       vote_start,
       vote_end,
       now()
     FROM contests
     WHERE submission_start < now()
     ${ALLOW_DEV_CONTEST ? "AND id = 'dev'" : ''}
     ORDER BY submission_start DESC
     LIMIT 1`,
  );
  return result;
};

exports.getCurrentContestSubmissions = async () => {
  const contest = await this.getCurrentContest();
  if (!contest) {
    return null;
  }

  const submissions = await db.select(
    `SELECT
       ce.category,
       e.background_color,
       e.description,
       e.id,
       '/i/' || e.id || '.png' AS image_path,
       e.modified_by,
       e.name,
       e.rejection_reason,
       e.submission_status,
       e.submission_time,
       e.user
     FROM contest_entries ce, entries e
     WHERE ce.entry_id = e.id AND ce.contest_id = $1
     ORDER BY e.submission_time`,
    [contest.id],
  );
  return submissions;
};

exports.getVoteDates = async (contestId) => {
  const voteDates = await db.select(
    'SELECT local_voting, vote_start, vote_end, now() FROM contests WHERE id = $1',
    [contestId],
  );
  return voteDates;
};

/**
 * Refreshes the contests summary materialized view.
 * Attempts to perform a concurrent refresh first to avoid locking reads on the view,
 * falling back to a standard refresh if the concurrent attempt fails.
 *
 * @returns {Promise<void>}
 */
exports.refreshContestsSummaryView = async () => {
  try {
    await db.none('REFRESH MATERIALIZED VIEW CONCURRENTLY contests_summary');
  } catch (err) {
    logger.warn(
      `CONCURRENTLY refresh failed, falling back to standard refresh. Error: ${
        err.message || err
      }`,
    );
    await db.none('REFRESH MATERIALIZED VIEW contests_summary');
  }
};

/**
 * Invokes the PostgreSQL add_contest function to create a new contest.
 *
 * @param {Object} contestData
 * @returns {Promise<void>}
 */
exports.addContest = async ({
  name,
  date,
  prompt,
  id = null,
  yearEnd = null,
  submissionStart = null,
  submissionEnd = null,
  voteStart = null,
  voteEnd = null,
  categories = null,
}) => {
  const defaultDates = getDefaultContestDates(date);

  await db.any(
    `SELECT add_contest(
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
    )`,
    [
      name,
      date,
      prompt,
      id || getContestId(date),
      yearEnd !== null && yearEnd !== undefined ? yearEnd : false,
      submissionStart || defaultDates.submissionStart,
      submissionEnd || defaultDates.submissionEnd,
      voteStart || defaultDates.voteStart,
      voteEnd || defaultDates.voteEnd,
      categories && categories.length ? categories : null,
    ],
  );
};
