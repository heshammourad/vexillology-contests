const { getCurrentContestSubmissions } = require('../db/queries');
const { createLogger } = require('../logger');

const logger = createLogger('API/REVIEW_SUBMISSIONS');

exports.get = async (req, res) => {
  try {
    const submissions = await getCurrentContestSubmissions();
    res.status(200).send(submissions);
  } catch (err) {
    logger.error(`Error getting /reviewSubmissions: ${err}`);
    res.status(500).send();
  }
};
