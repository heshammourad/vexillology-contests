/**
 * Moderator review of submitted content
 */

const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/ANALYZE_VOTES');

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
      ORDER BY average ASC`,
      [id],
    );

    const entryAvg = await db.select(
      `SELECT entry_id, AVG(rating) as average
      FROM votes
      WHERE contest_id = $1
      GROUP BY entry_id`,
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

    if (!votes || !userAvg || !entryAvg || !userEntries) {
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
