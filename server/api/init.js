const db = require('../db');
const { createLogger } = require('../logger');

const { TITLE = 'Vexillology Contests', WEB_APP_CLIENT_ID } = process.env;

const logger = createLogger('API/INIT');

exports.get = async (req, res) => {
  try {
    const experimentsData = await db.select('SELECT * FROM experiments');
    const experiments = experimentsData.reduce((acc, { active, name }) => {
      acc[name] = active;
      return acc;
    }, {});
    res.send({
      experiments,
      title: TITLE,
      webAppClientId: WEB_APP_CLIENT_ID,
    });
  } catch (err) {
    logger.error(`Error getting /init: ${err}`);
    res.status(500).send();
  }
};
