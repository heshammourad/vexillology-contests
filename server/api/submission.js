const { isAfter } = require('date-fns');

const db = require('../db');
const { getCategories } = require('../db/queries');
const { getToken } = require('../firebase');
const { createLogger } = require('../logger');
const reddit = require('../reddit');

const logger = createLogger('API/SUBMISSION');

const getCurrentContest = async () => {
  const [result] = await db.select(
    `SELECT id, name, prompt, submission_start, submission_end, now()
    FROM contests
    WHERE submission_start < now()
    ORDER BY submission_start DESC
    LIMIT 1`,
  );
  return result;
};

const getSubmissions = async (contestId, username) => {
  const submissions = await db.select(
    `SELECT ce.category, e.description, ce.entry_id, e.name, e.submission_status, e.url
        FROM entries e, contest_entries ce
        WHERE e.id = ce.entry_id AND ce.contest_id = $1 AND e.user = $2`,
    [contestId, username],
  );
  return submissions;
};

exports.get = async ({ headers: { accesstoken, refreshtoken } }, res) => {
  try {
    const { now, ...result } = await getCurrentContest();
    if (!result) {
      res.status(404).send();
      return;
    }

    const categories = await getCategories(result.id);

    let firebaseToken;
    let submissions;
    if (accesstoken && refreshtoken) {
      const username = await reddit.getUser({ accesstoken, refreshtoken });
      logger.debug(`Auth tokens present, creating token for ${username}`);
      if (!username) {
        res.status(401).send();
        return;
      }

      firebaseToken = await getToken(username);

      submissions = await getSubmissions(result.id, username);
    }

    const response = { ...result, categories };
    if (firebaseToken) {
      response.firebaseToken = firebaseToken;
      response.submissions = submissions;
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
    },
    headers: { accesstoken, refreshtoken },
  },
  res,
) => {
  try {
    if (!accesstoken || !refreshtoken) {
      res.status(401).send('Missing authentication headers.');
      return;
    }

    const { now, submissionEnd } = await getCurrentContest();
    if (isAfter(now, submissionEnd)) {
      logger.warn('Entry submitted after submission window closed');
      res.status(403).send(`Submission window closed at ${submissionEnd}`);
      return;
    }

    const user = await reddit.getUser({ accesstoken, refreshtoken });
    if (!user) {
      res.status(401).send('Unable to find Reddit username');
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
      user,
    };
    await db.insert('entries', [submissionData]);

    const contestEntryData = { category, contest_id: contestId, entry_id: id };
    // TODO: Roll back previous insert if this fails?
    await db.insert('contest_entries', [contestEntryData]);

    const submissions = await getSubmissions(contestId, user);
    res.status(200).send(submissions);
  } catch (err) {
    logger.error(`Error posting /submission: ${err}`);
    res.status(500).send();
  }
};
