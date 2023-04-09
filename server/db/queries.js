const db = require('.');

exports.getCategories = async (contestId) => {
  const categories = await db.select(
    'SELECT category FROM contest_categories WHERE contest_id = $1 ORDER BY category',
    [contestId],
  );
  return categories.map(({ category }) => category);
};

exports.getCurrentContest = async () => {
  const [result] = await db.select(
    `SELECT id, name, prompt, submission_start, submission_end, now()
     FROM contests
     WHERE submission_start < now()
     ORDER BY submission_start DESC
     LIMIT 1`,
  );
  return result;
};

exports.getCurrentContestSubmissions = async () => {
  const { id } = await this.getCurrentContest();
  const submissions = await db.select(
    `SELECT ce.category, e.description, e.id, e.name, e.submission_status, e.url, e.user
     FROM contest_entries ce, entries e
     WHERE ce.entry_id = e.id AND ce.contest_id = $1`,
    [id],
  );
  return submissions;
};

exports.getVoteDates = async (contestId) => {
  const voteDates = await db.select(
    'SELECT vote_start, vote_end, now() FROM contests WHERE id = $1',
    [contestId],
  );
  return voteDates;
};
