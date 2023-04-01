const db = require('.');

exports.getCategories = async (contestId) => {
  const categories = await db.select(
    'SELECT category FROM contest_categories WHERE contest_id = $1 ORDER BY category',
    [contestId],
  );
  return categories.map(({ category }) => category);
};

exports.getVoteDates = async (contestId) => {
  const voteDates = await db.select(
    'SELECT vote_start, vote_end, now() FROM contests WHERE id = $1',
    [contestId],
  );
  return voteDates;
};
