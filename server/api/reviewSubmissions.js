/**
 * Moderator review of submitted content
 */

const db = require('../db');
const {
  getCurrentContest,
  getCurrentContestSubmissions,
} = require('../db/queries');
const { createLogger } = require('../logger');

const logger = createLogger('API/REVIEW_SUBMISSIONS');

exports.get = async (req, res) => {
  try {
    const contest = await getCurrentContest();
    if (!contest) {
      res.status(404).send();
      return;
    }

    const submissions = await getCurrentContestSubmissions();
    const breakdownMap = new Map();
    submissions.forEach(({ submissionStatus, user }) => {
      const userBreakdown = breakdownMap.get(user) ?? { submitted: 0 };
      userBreakdown.submitted += 1;
      userBreakdown[submissionStatus] = (userBreakdown[submissionStatus] ?? 0) + 1;

      breakdownMap.set(user, userBreakdown);
    });

    const { name, submissionEnd } = contest;
    res.send({
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
      res
        .status(400)
        .send(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
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
        {
          name: 'submission_status',
          cast: 'vexillology_contests_common.submission_status',
        },
      ],
      ['id', 'modified_by', 'rejection_reason', 'submission_status'],
    );
    if (!response) {
      res.status(404).send('Entry with that id not found');
      return;
    }
    res.send(response);
  } catch (err) {
    logger.error(`Error putting /reviewSubmissions: ${err}`);
    res.status(500).send();
  }
};
