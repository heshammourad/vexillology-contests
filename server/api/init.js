const db = require('../db');
const { getCurrentContestSubmissions } = require('../db/queries');
const { createLogger } = require('../logger');
const reddit = require('../reddit');

const { TITLE = 'Vexillology Contests', WEB_APP_CLIENT_ID } = process.env;

const logger = createLogger('API/INIT');

exports.get = async ({ headers: { accesstoken, refreshtoken } }, res) => {
  try {
    const experimentsData = await db.select('SELECT * FROM experiments');
    const experiments = experimentsData.reduce((acc, { active, name }) => {
      acc[name] = active;
      return acc;
    }, {});

    let isModerator = false;
    let submissionsToReview = 0;
    if (accesstoken && refreshtoken) {
      isModerator = await reddit.isModerator({ accesstoken, refreshtoken });
      if (isModerator) {
        const submissions = await getCurrentContestSubmissions();
        submissionsToReview = submissions.length;
      }
    }

    res.send({
      experiments,
      isModerator,
      submissionsToReview,
      title: TITLE,
      webAppClientId: WEB_APP_CLIENT_ID,
    });
  } catch (err) {
    logger.error(`Error getting /init: ${err}`);
    res.status(500).send();
  }
};
