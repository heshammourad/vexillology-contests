/**
 * @exports addCategories
 * @exports addContest
 * @exports deleteContest
 * @exports getAllContests
 * @exports getCategories
 * @exports getContestById
 * @exports getContestForMonth
 * @exports getCurrentContest
 * @exports getCurrentContestSubmissions
 * @exports getPreviousContest
 * @exports getUsedCategories
 * @exports getVoteDates
 * @exports hasContestEntries
 * @exports refreshContestsSummaryView
 * @exports removeCategories
 * @exports renameContestId
 * @exports updateContest
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

/**
 * Retrieves the categories that have at least one submission attached to them for a contest,
 * i.e. categories that can no longer be removed.
 *
 * @param {string} contestId
 * @returns {Promise<string[]>}
 */
exports.getUsedCategories = async (contestId) => {
  const categories = await db.select(
    'SELECT DISTINCT category FROM contest_entries WHERE contest_id = $1 AND category IS NOT NULL',
    [contestId],
  );
  return categories.map(({ category }) => category);
};

/**
 * Checks whether any entries have been submitted to a contest yet.
 *
 * @param {string} contestId
 * @returns {Promise<boolean>}
 */
exports.hasContestEntries = async (contestId) => {
  const result = await db.select(
    'SELECT 1 FROM contest_entries WHERE contest_id = $1 LIMIT 1',
    [contestId],
    true,
  );
  return !!result;
};

/**
 * Adds new categories to a contest, appending them after the current highest sort order.
 *
 * @param {string} contestId
 * @param {string[]} categories
 * @returns {Promise<void>}
 */
exports.addCategories = async (contestId, categories) => {
  if (!categories.length) {
    return;
  }

  const { maxSortOrder } = await db.select(
    'SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM contest_categories WHERE contest_id = $1',
    [contestId],
    true,
  );

  await db.insert(
    'contest_categories',
    categories.map((category, index) => ({
      contest_id: contestId,
      category,
      sort_order: maxSortOrder + index + 1,
    })),
  );
};

/**
 * Removes categories from a contest. Callers are responsible for confirming none of the
 * categories being removed are already in use (see getUsedCategories).
 *
 * @param {string} contestId
 * @param {string[]} categories
 * @returns {Promise<void>}
 */
exports.removeCategories = async (contestId, categories) => {
  if (!categories.length) {
    return;
  }

  await db.none(
    'DELETE FROM contest_categories WHERE contest_id = $1 AND category = ANY($2)',
    [contestId, categories],
  );
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

/**
 * Retrieves every contest that hasn't been certified yet (i.e. current or upcoming contests).
 *
 * @returns {Promise<Array<Object>>}
 */
exports.getAllContests = async () => db.select(
  `SELECT
     id,
     name,
     date,
     submission_start,
     submission_end,
     vote_start,
     vote_end
   FROM contests
   WHERE results_certified = false
   ORDER BY date`,
);

/**
 * Retrieves a single contest by id, for the moderator edit form.
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
exports.getContestById = async (id) => db.select(
  `SELECT
     id,
     name,
     date,
     prompt,
     submission_start,
     submission_end,
     vote_start,
     vote_end,
     results_certified
   FROM contests
   WHERE id = $1`,
  [id],
  true,
);

/**
 * Finds an existing non-year-end contest already scheduled for the given month, if any -
 * used to prevent two regular contests from being created for the same month.
 *
 * @param {string} date
 * @param {string} [excludeId] - A contest id to exclude from the search (e.g. when editing).
 * @returns {Promise<Object|null>}
 */
exports.getContestForMonth = async (date, excludeId = null) => db.select(
  `SELECT id, name FROM contests WHERE date = $1 AND year_end = false${
    excludeId ? ' AND id != $2' : ''
  }`,
  excludeId ? [date, excludeId] : [date],
  true,
);

/**
 * Finds the contest immediately preceding the given month, if any - used to make sure a
 * contest's submission start (which is otherwise allowed to precede its own month) doesn't
 * overlap with the previous contest's own submission/voting window.
 *
 * @param {string} date
 * @param {string} [excludeId] - A contest id to exclude from the search (e.g. when editing).
 * @returns {Promise<Object|null>}
 */
exports.getPreviousContest = async (date, excludeId = null) => db.select(
  `SELECT name, vote_end FROM contests WHERE date < $1${
    excludeId ? ' AND id != $2' : ''
  } ORDER BY date DESC LIMIT 1`,
  excludeId ? [date, excludeId] : [date],
  true,
);

/**
 * Updates the editable fields of an existing contest.
 *
 * @param {Object} contestData
 * @returns {Promise<Object>} The updated contest row.
 */
exports.updateContest = async ({
  id,
  name,
  date,
  prompt,
  submissionStart,
  submissionEnd,
  voteStart,
  voteEnd,
}) => {
  const [result] = await db.update(
    'contests',
    [
      {
        id,
        name,
        date,
        prompt,
        submission_start: submissionStart,
        submission_end: submissionEnd,
        vote_start: voteStart,
        vote_end: voteEnd,
      },
    ],
    [
      '?id',
      'name',
      'date',
      'prompt',
      'submission_start',
      'submission_end',
      'vote_start',
      'vote_end',
    ],
    [
      'id',
      'name',
      'date',
      'prompt',
      'submission_start',
      'submission_end',
      'vote_start',
      'vote_end',
      'results_certified',
    ],
  );
  return result;
};

/**
 * Renames a contest's id. Only safe to call for contests that have no submissions yet
 * (see hasContestEntries), since this relies on the contest_categories foreign key having
 * ON UPDATE CASCADE to follow along; if it doesn't, this throws and nothing changes.
 *
 * @param {string} oldId
 * @param {string} newId
 * @returns {Promise<void>}
 */
exports.renameContestId = async (oldId, newId) => {
  await db.none('UPDATE contests SET id = $2 WHERE id = $1', [oldId, newId]);
};

/**
 * Deletes a contest and its categories. Only safe to call for contests that have no
 * submissions yet (see hasContestEntries) - callers are responsible for confirming that.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
exports.deleteContest = async (id) => {
  await db.del('contest_categories', { contest_id: id });
  await db.del('contests', { id });
};
