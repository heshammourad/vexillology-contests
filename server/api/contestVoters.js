/**
 * Moderator review of submitted content
 */

const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/ANALYZE_VOTES');

const getVotersData = async (contestId) => {
  const votersData = await db.select(
    `SELECT 
      u.username,
      u.karma,
      u.created_date,
      EXTRACT(EPOCH FROM (NOW() - u.created_date)) / 86400 AS age_in_days,
      COUNT(v.entry_id) as votes_cast,
      (SELECT COUNT(DISTINCT ce.entry_id) 
       FROM contest_entries ce 
       JOIN entries e ON ce.entry_id = e.id 
       WHERE ce.contest_id = $1 AND e.submission_status = 'approved') as total_approved_entries,
      ROUND((COUNT(v.entry_id)::float / 
        (SELECT COUNT(DISTINCT ce.entry_id)::float 
         FROM contest_entries ce 
         JOIN entries e ON ce.entry_id = e.id 
         WHERE ce.contest_id = $1 AND e.submission_status = 'approved') * 100)::numeric, 1) as vote_percentage
    FROM users u
    LEFT JOIN votes v ON u.username = v.username AND v.contest_id = $1
    GROUP BY u.username, u.karma, u.created_date
    HAVING COUNT(v.entry_id) > 0
    ORDER BY vote_percentage DESC, u.username ASC`,
    [contestId],
  );

  return votersData;
};

exports.get = async ({ params: { id } }, res) => {
  try {
    const votersData = await getVotersData(id);

    res.send({ voters: votersData });
  } catch (err) {
    logger.error(`Error getting /contestVoters/${id}/voters: ${err}`);
    res.status(500).send();
  }
};
