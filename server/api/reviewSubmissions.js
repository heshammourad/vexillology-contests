const { getCurrentContest, getCurrentContestSubmissions } = require('../db/queries');
const { createLogger } = require('../logger');

const logger = createLogger('API/REVIEW_SUBMISSIONS');

exports.get = async (req, res) => {
  try {
    const { name, submissionEnd } = await getCurrentContest();
    const submissions = await getCurrentContestSubmissions();

    const breakdownMap = new Map();
    submissions.forEach(({ submissionStatus, user }) => {
      const userBreakdown = breakdownMap.get(user) ?? {};
      const submittedCount = userBreakdown?.submitted ?? 0;
      userBreakdown.submitted = submittedCount + 1;

      if (submissionStatus === 'approved') {
        const approvedCount = userBreakdown?.approved ?? 0;
        userBreakdown.approved = approvedCount + 1;
      }

      breakdownMap.set(user, userBreakdown);
    });

    res.status(200).send({
      name,
      submissionEnd,
      submissions,
      userBreakdown: Object.fromEntries(breakdownMap),
    });
  } catch (err) {
    logger.error(`Error getting /reviewSubmissions: ${err}`);
    res.status(500).send();
  }
};
