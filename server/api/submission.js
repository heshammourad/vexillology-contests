const { isAfter } = require('date-fns');

const db = require('../db');
const { getCategories, getCurrentContest } = require('../db/queries');
const { getToken } = require('../firebase');
const { createLogger } = require('../logger');

const logger = createLogger('API/SUBMISSION');

const getSubmissions = async (contestId, username) => {
  const submissions = await db.select(
    `SELECT ce.category, e.description, ce.entry_id, e.name, e.submission_status, e.url
        FROM entries e, contest_entries ce
        WHERE e.id = ce.entry_id AND ce.contest_id = $1 AND e.user = $2`,
    [contestId, username],
  );
  return submissions;
};

exports.get = async ({ username }, res) => {
  try {
    const { now, ...result } = await getCurrentContest();
    if (!result) {
      res.status(404).send();
      return;
    }

    const categories = await getCategories(result.id);
    const response = { ...result, categories };

    if (username) {
      response.firebaseToken = await getToken(username);
      response.submissions = await getSubmissions(result.id, username);
    }

    res.status(200).send(response);
  } catch (err) {
    logger.error(`Error getting /submission: ${err}`);
    res.status(500).send();
  }
};

// eslint-disable-next-line max-len
const isValidDimension = (dimension) => Number.isInteger(dimension) && dimension >= 0 && dimension <= 3000;

exports.post = async (
  {
    body: {
      category, contestId, description, height, name, url, width,
    }, username,
  },
  res,
) => {
  try {
    const { now, submissionEnd } = await getCurrentContest();
    if (isAfter(now, submissionEnd)) {
      logger.warn('Entry submitted after submission window closed');
      res.status(403).send(`Submission window closed at ${submissionEnd}`);
      return;
    }

    if (!description || !height || !name || !url || !width) {
      const missingFields = [];
      if (!description) {
        missingFields.push('description');
      }
      if (!height) {
        missingFields.push('height');
      }
      if (!name) {
        missingFields.push('name');
      }
      if (!url) {
        missingFields.push('url');
      }
      if (!width) {
        missingFields.push('width');
      }
      res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
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
      description,
      height,
      id,
      name,
      width,
      url,
      user: username,
    };
    await db.insert('entries', [submissionData]);

    const contestEntryData = { category, contest_id: contestId, entry_id: id };
    // TODO: Roll back previous insert if this fails?
    await db.insert('contest_entries', [contestEntryData]);

    const submissions = await getSubmissions(contestId, username);
    res.status(200).send(submissions);
  } catch (err) {
    logger.error(`Error posting /submission: ${err}`);
    res.status(500).send();
  }
};
