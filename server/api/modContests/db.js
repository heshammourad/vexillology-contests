/**
 * @file Exposes the database queries behind the moderator Manage Contests page.
 */

const db = require('../../db');

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

// Appends categories to a contest after its current highest sort order, in the order given.
// Takes the transaction it runs in.
const insertCategories = async (t, contestId, categories) => {
  if (!categories.length) {
    return;
  }
  await t.none(
    `INSERT INTO contest_categories (contest_id, category, sort_order)
     SELECT
       $1,
       c.category,
       (SELECT COALESCE(MAX(sort_order), -1) FROM contest_categories WHERE contest_id = $1)
         + c.ord
     FROM unnest($2::text[]) WITH ORDINALITY AS c(category, ord)`,
    [contestId, categories],
  );
};

/**
 * Creates a contest and its categories in one transaction. Every field is required: the
 * caller resolves the id and default schedule (see server/contestSchedule.js).
 *
 * @param {Object} contestData
 * @returns {Promise<void>}
 */
exports.addContest = async ({
  id,
  name,
  date,
  prompt,
  submissionStart,
  submissionEnd,
  voteStart,
  voteEnd,
  categories,
}) => db.tx(async (t) => {
  await t.none(
    `INSERT INTO contests
       (id, name, date, prompt, submission_start, submission_end, vote_start, vote_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      name,
      date,
      prompt,
      submissionStart,
      submissionEnd,
      voteStart,
      voteEnd,
    ],
  );
  await insertCategories(t, id, categories);
});

/**
 * Retrieves every regular (non-year-end) contest whose results haven't been certified yet,
 * i.e. current and upcoming contests plus any awaiting certification.
 *
 * @returns {Promise<Array<Object>>}
 */
exports.getUncertifiedContests = async () => db.select(
  `SELECT
     id,
     name,
     date,
     submission_start,
     submission_end,
     vote_start,
     vote_end
   FROM contests
   WHERE results_certified = false AND year_end = false
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
     results_certified,
     year_end
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
 * Unlike getContestForMonth, this includes year-end contests on purpose: January's
 * submissions mustn't open before Best of Year's voting ends.
 *
 * @param {string} date
 * @param {string} [excludeId] - A contest id to exclude from the search (e.g. when editing).
 * @returns {Promise<Object|null>}
 */
exports.getPreviousContest = async (date, excludeId = null) => db.select(
  `SELECT name, vote_end FROM contests WHERE date < $1${
    excludeId ? ' AND id != $2' : ''
  } ORDER BY date DESC, vote_end DESC LIMIT 1`,
  excludeId ? [date, excludeId] : [date],
  true,
);

/**
 * Finds the regular contest immediately following the given month, if any - used to make
 * sure a contest's voting doesn't run past the point the next contest opens submissions.
 * Year-end contests are left out: Best of Year's submission window overlaps December's
 * contest by design, since its entries are seeded rather than submitted.
 *
 * @param {string} date
 * @param {string} [excludeId] - A contest id to exclude from the search (e.g. when editing).
 * @returns {Promise<Object|null>}
 */
exports.getNextContest = async (date, excludeId = null) => db.select(
  `SELECT name, submission_start FROM contests WHERE date > $1 AND year_end = false${
    excludeId ? ' AND id != $2' : ''
  } ORDER BY date, submission_start LIMIT 1`,
  excludeId ? [date, excludeId] : [date],
  true,
);

/**
 * Saves a moderator's edit to a contest in one transaction: renames its id (when newId
 * differs; only safe for contests without submissions, see hasContestEntries), updates its
 * editable fields, and adds/removes categories. Callers are responsible for confirming none of
 * the categories being removed are already in use (see getUsedCategories). Categories follow a
 * rename through the contest_categories foreign key's ON UPDATE CASCADE
 * (server/db/changes/20261019-contest-categories-cascade.sql).
 *
 * @param {Object} contestData
 * @returns {Promise<Object>} The updated contest row.
 */
exports.updateContest = async ({
  id,
  newId = id,
  name,
  date,
  prompt,
  submissionStart,
  submissionEnd,
  voteStart,
  voteEnd,
  categoriesToAdd = [],
  categoriesToRemove = [],
}) => db.tx(async (t) => {
  if (newId !== id) {
    await t.none('UPDATE contests SET id = $2 WHERE id = $1', [id, newId]);
  }

  const result = await t.one(
    `UPDATE contests SET
       name = $2,
       date = $3,
       prompt = $4,
       submission_start = $5,
       submission_end = $6,
       vote_start = $7,
       vote_end = $8
     WHERE id = $1
     RETURNING
       id,
       name,
       date,
       prompt,
       submission_start,
       submission_end,
       vote_start,
       vote_end,
       results_certified`,
    [
      newId,
      name,
      date,
      prompt,
      submissionStart,
      submissionEnd,
      voteStart,
      voteEnd,
    ],
  );

  if (categoriesToRemove.length) {
    await t.none(
      'DELETE FROM contest_categories WHERE contest_id = $1 AND category = ANY($2)',
      [newId, categoriesToRemove],
    );
  }

  await insertCategories(t, newId, categoriesToAdd);

  return result;
});

/**
 * Deletes a contest and its categories. Only safe to call for contests that have no
 * submissions yet (see hasContestEntries) - callers are responsible for confirming that.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
exports.deleteContest = async (id) => db.tx(async (t) => {
  // Redundant once contest_categories_fk has ON DELETE CASCADE
  // (server/db/changes/20261019-contest-categories-cascade.sql), but keeps delete working in a
  // schema that hasn't had that change applied yet.
  await t.none('DELETE FROM contest_categories WHERE contest_id = $1', [id]);
  await t.none('DELETE FROM contests WHERE id = $1', [id]);
});
