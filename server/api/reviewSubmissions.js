const { getCurrentContest, getCurrentContestSubmissions } = require('../db/queries');
const { createLogger } = require('../logger');

const logger = createLogger('API/REVIEW_SUBMISSIONS');

exports.get = async (req, res) => {
  try {
    const { name, submissionEnd } = await getCurrentContest();
    const submissions = await getCurrentContestSubmissions();

    const submissionMap = new Map();
    submissions.forEach(({ user }) => {
      const currentCount = submissionMap.get(user);
      submissionMap.set(user, 1 + currentCount || 0);
    });

    res.status(200).send({
      name,
      submissionEnd,
      submissionCountByUser: Object.fromEntries(submissionMap),
      submissions,
    });
  } catch (err) {
    logger.error(`Error getting /reviewSubmissions: ${err}`);
    res.status(500).send();
  }
};
