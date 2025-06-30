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

exports.getVoters = async ({ params: { id } }, res) => {
  try {
    const votersData = await getVotersData(id);

    res.send({ voters: votersData });
  } catch (err) {
    logger.error(`Error getting /analyzeVotes/${id}/voters: ${err}`);
    res.status(500).send();
  }
};

exports.get = async ({ params: { id } }, res) => {
  try {
    const votes = await db.select(
      `SELECT entry_id, username, rating
      FROM votes
      WHERE contest_id = $1`,
      [id],
    );

    const userAvg = await db.select(
      `SELECT username, AVG(rating) as average
      FROM votes
      WHERE contest_id = $1
      GROUP BY username
      ORDER BY username ASC`,
      [id],
    );

    const entryAvg = await db.select(
      `SELECT entry_id, AVG(rating) as average
      FROM votes
      WHERE contest_id = $1
      GROUP BY entry_id
      ORDER BY average ASC`,
      [id],
    );

    const userEntries = await db.select(
      `SELECT id, "user"
      FROM entries e
      JOIN contest_entries ce
        ON e.id = ce.entry_id
      WHERE contest_id = $1`,
      [id],
    );

    if (
      !votes.length
      || !userAvg.length
      || !entryAvg.length
      || !userEntries.length
    ) {
      res.status(404).send();
      return;
    }
    res.send({
      entryAvg,
      votes,
      userAvg,
      userEntries,
    });
  } catch (err) {
    logger.error(`Error getting /analyzeVotes: ${err}`);
    res.status(500).send();
  }
};
