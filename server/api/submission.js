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
      description, height, id, name, width, url, user,
    };
    await db.insert('entries', [submissionData]);

    const contestEntryData = { category, contest_id: contestId, entry_id: id };
    await db.insert('contest_entries', [contestEntryData]);

    // TODO: Check number of remaining entries
    res.status(200).send();
  } catch (err) {
    logger.error(`Error posting /submission: ${err}`);
    res.status(500).send();
  }
};
