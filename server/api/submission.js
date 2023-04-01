const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/SUBMISSION');

exports.get = async (req, res) => {
  try {
    const result = await db.select(
      `SELECT id, name, prompt, submission_start, submission_end
      FROM contests
      WHERE submission_start < now()
      LIMIT 1`,
    );
    if (!result.length) {
      res.status(404).send();
    }
    // TODO: Add categories
    // TODO: Add Firebase token
    res.status(200).send(result[0]);
  } catch (err) {
    logger.error(`Error getting /submission: ${err}`);
    res.status(500).send();
  }
};
