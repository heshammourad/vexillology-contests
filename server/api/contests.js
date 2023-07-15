/**
 * Fetch from database all contests date, id, name, and year_end
 */

const db = require('../db');
const { CONTEST_ENV_LEVEL } = require('../env');
const { createLogger } = require('../logger');

const logger = createLogger('API/CONTESTS');

exports.get = async (req, res) => {
  try {
    const result = await db.select(
      `SELECT date, id, name, year_end
       FROM contests
       WHERE env_level >= $1
         AND (submission_start IS NULL OR submission_start < now())
       ORDER BY date DESC`,
      [CONTEST_ENV_LEVEL],
    );
    res.send(
      result.map(({ date, ...rest }) => ({
        ...rest,
        date: date.toJSON().substr(0, 10),
      })),
    );
  } catch (err) {
    logger.error(`Error getting /contests: ${err}`);
    res.status(500).send();
  }
};
