const db = require('../db');
const { getCategories } = require('../db/queries');
const { getToken } = require('../firebase');
const { createLogger } = require('../logger');
const reddit = require('../reddit');

const logger = createLogger('API/SUBMISSION');

exports.get = async ({ headers: { accesstoken, refreshtoken } }, res) => {
  try {
    const [result] = await db.select(
      `SELECT id, name, prompt, submission_start, submission_end
      FROM contests
      WHERE submission_start < now()
      LIMIT 1`,
    );
    if (!result) {
      res.status(404).send();
      return;
    }

    const categories = await getCategories(result.id);

    let firebaseToken;
    if (accesstoken && refreshtoken) {
      const username = await reddit.getUser({ accesstoken, refreshtoken });
      logger.debug(`Auth tokens present, creating token for ${username}`);
      if (!username) {
        res.status(401).send();
        return;
      }

      firebaseToken = await getToken(username);
    }

    const response = { ...result, categories };
    if (firebaseToken) {
      response.firebaseToken = firebaseToken;
    }

    res.status(200).send(response);
  } catch (err) {
    logger.error(`Error getting /submission: ${err}`);
    res.status(500).send();
  }
};
