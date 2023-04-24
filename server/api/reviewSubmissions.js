const db = require('../db');
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

const VALID_STATUSES = ['approved', 'pending', 'rejected'];

exports.put = async ({ body: { id, rejectionReason, status }, username }, res) => {
  try {
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).send(`Status must be one of: ${VALID_STATUSES.split(', ')}`);
      return;
    }

    const rejected = status === 'rejected';

    if (rejected && !rejectionReason) {
      res.status(400).send('Rejection reason must be included to reject entry');
      return;
    }

    const [response] = await db.update(
      'entries',
      [
        {
          id,
          modified_by: username,
          rejection_reason: rejected ? rejectionReason : null,
          submission_status: status,
        },
      ],
      [
        '?id',
        'modified_by',
        'rejection_reason',
        { name: 'submission_status', cast: 'submission_status' },
      ],
      ['id', 'modified_by', 'rejection_reason', 'submission_status'],
    );
    if (!response) {
      res.status(404).send(`Entry with id='${id}' not found`);
      return;
    }
    res.status(200).send(response);
  } catch (err) {
    logger.error(`Error putting /reviewSubmissions: ${err}`);
    res.status(500).send();
  }
};
