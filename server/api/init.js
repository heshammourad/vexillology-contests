const { fromUnixTime, format } = require('date-fns');

const db = require('../db');
const { getCurrentContestSubmissions } = require('../db/queries');
const { TITLE } = require('../env');
const { createLogger } = require('../logger');

const { WEB_APP_CLIENT_ID } = process.env;

const logger = createLogger('API/INIT');

exports.get = async ({ moderator, userAttributes, username }, res) => {
  try {
    const experimentsData = await db.select('SELECT * FROM experiments');
    const experiments = experimentsData.reduce((acc, { active, name }) => {
      acc[name] = active;
      return acc;
    }, {});

    const response = {
      experiments,
      title: TITLE,
      webAppClientId: WEB_APP_CLIENT_ID,
    };

    if (moderator) {
      response.moderator = true;
      const submissions = await getCurrentContestSubmissions();
      if (submissions) {
        response.submissionsToReview = submissions.filter(
          ({ submissionStatus }) => submissionStatus === 'pending',
        ).length;
      }
    }

    res.send(response);
  } catch (err) {
    logger.error(`Error getting /init: ${err}`);
    res.status(500).send();
  }

  // Insert user attributes into database
  if (!username) {
    return;
  }
  try {
    const { createdUtc, karma } = userAttributes;
    const createdDate = format(
      fromUnixTime(createdUtc),
      'yyyy-MM-dd HH:mm:ss.SSS',
    );
    await db.insert(
      'users',
      [
        {
          created_date: createdDate,
          karma,
          username,
        },
      ],
      { conflictTargets: ['username'] },
    );
  } catch (err) {
    logger.warn(`Unable to insert user attributes: ${err}`);
  }
};
