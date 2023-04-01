const db = require('.');

exports.getVoteDates = async (contestId) => {
  const voteDates = await db.select(
    'SELECT vote_start, vote_end, now() FROM contests WHERE id = $1',
    [contestId],
  );
  return voteDates;
};
