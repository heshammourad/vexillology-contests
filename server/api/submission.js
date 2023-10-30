const { isAfter, isBefore } = require('date-fns');

const db = require('../db');
const { getCategories, getCurrentContest } = require('../db/queries');
const { IS_FIREBASE_OFF } = require('../env');
const { getToken } = require('../firebase');
const { createLogger } = require('../logger');
const { generateImagePath } = require('../util');

const logger = createLogger('API/SUBMISSION');

/**
 * Retrieves submissions from the database.
 *
 * @param {string} contestId
 * @param {string} username
 */
const getSubmissions = async (contestId, username) => {
  const submissions = await db.select(
    `SELECT
       ce.category,
       e.background_color,
       e.description,
       e.id,
       e.name,
       e.rejection_reason,
       e.submission_status,
       e.submission_time,
       e.url
     FROM entries e, contest_entries ce
     WHERE e.id = ce.entry_id AND ce.contest_id = $1 AND e.user = $2
     ORDER BY e.submission_time`,
    [contestId, username],
  );
  return submissions.map((submission) => ({
    ...submission,
    imagePath: generateImagePath(submission.id),
  }));
};

exports.get = async ({ username }, res) => {
  try {
    const contest = await getCurrentContest();
    if (!contest) {
      res.status(404).send();
      return;
    }

    const { now, ...result } = contest;
    const categories = await getCategories(result.id);
    const response = { ...result, categories };

    if (username) {
      if (!IS_FIREBASE_OFF) {
        response.firebaseToken = await getToken(username);
      }
      response.submissions = await getSubmissions(result.id, username);
    }

    res.send(response);
  } catch (err) {
    logger.error(`Error getting /submission: ${err}`);
    res.status(500).send();
  }
};

// eslint-disable-next-line max-len
const isValidDimension = (dimension) => Number.isInteger(dimension) && dimension >= 0 && dimension <= 3000;

const isWithinSubmissionWindow = async () => {
  const { now, submissionStart, submissionEnd } = await getCurrentContest();
  return isAfter(now, submissionStart) && isBefore(now, submissionEnd);
};

exports.post = async (
  {
    body: {
      category, contestId, description, height, name, url, width, backgroundColor,
    }, username,
  },
  res,
) => {
  try {
    const withinSubmissionWindow = await isWithinSubmissionWindow();
    if (!withinSubmissionWindow) {
      const warning = 'Entry submitted outside of submission window';
      logger.warn(warning);
      res.status(403).send(warning);
      return;
    }

    const validDimensionHeight = isValidDimension(height);
    const validDimensionWidth = isValidDimension(width);
    if (!validDimensionHeight || !validDimensionWidth) {
      const invalidDimensions = [];
      if (!validDimensionHeight) {
        invalidDimensions.push('height');
      }
      if (!validDimensionWidth) {
        invalidDimensions.push('width');
      }
      res
        .status(400)
        .send(`Expected ${invalidDimensions.join(' and ')} to be integers between 0 and 3000`);
      return;
    }

    const id = url.match(/%2F(\w*)/)[1];
    const submissionData = {
      background_color: backgroundColor,
      description,
      height,
      id,
      name,
      url,
      user: username,
      width,
    };
    await db.insert('entries', [submissionData]);

    const contestEntryData = { contest_id: contestId, entry_id: id };
    if (category) {
      contestEntryData.category = category;
    }
    // TODO: Roll back previous insert if this fails?
    await db.insert('contest_entries', [contestEntryData]);

    const submissions = await getSubmissions(contestId, username);
    res.send(submissions);
  } catch (err) {
    logger.error(`Error posting /submission: ${err}`);
    res.status(500).send();
  }
};

const VALID_STATUSES = ['pending', 'withdrawn'];

exports.put = async ({ body: { id, submissionStatus }, username }, res) => {
  try {
    if (!VALID_STATUSES.includes(submissionStatus)) {
      res.status(400).send(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
      return;
    }

    const withinSubmissionWindow = await isWithinSubmissionWindow();
    if (!withinSubmissionWindow) {
      const warning = 'Entry changed outside of submission window';
      logger.warn(warning);
      res.status(403).send(warning);
      return;
    }

    const [entry] = await db.select(
      'SELECT e.submission_status, e.user FROM entries e WHERE e.id = $1 AND e.user = $2',
      [id, username],
    );
    if (!entry) {
      const warning = 'Entry not found';
      logger.warn(warning);
      res.status(404).send(warning);
      return;
    }

    let response = { id, submissionStatus };
    if (entry.submissionStatus !== submissionStatus) {
      [response] = await db.update(
        'entries',
        [{ id, modified_by: null, submission_status: submissionStatus }],
        ['?id', 'modified_by', { name: 'submission_status', cast: 'submission_status' }],
        ['id', 'submission_status'],
      );
    }

    res.send(response);
  } catch (err) {
    logger.error(`Error putting /submissions: ${err}`);
    res.status(500).send();
  }
};
