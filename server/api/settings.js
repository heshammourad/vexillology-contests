const db = require('../db');
const { createLogger } = require('../logger');
const reddit = require('../reddit');

const logger = createLogger('API/SETTINGS');

const SETTINGS_FIELDS = ['contest_reminders'];

const getSettings = async (username) => {
  const [settings] = await db.select(
    `SELECT ${SETTINGS_FIELDS.join(', ')} FROM users WHERE username = $1`,
    [username],
  );
  return settings;
};

exports.all = ({ headers: { accesstoken, refreshtoken } }, res, next) => {
  try {
    if (!accesstoken || !refreshtoken) {
      res.status(401).send('Missing authentication headers.');
      return;
    }
    next();
  } catch (e) {
    logger.error(`Error validing /settings request: ${e}`);
    res.status(500).send();
  }
};

exports.get = async ({ headers }, res) => {
  try {
    const username = await reddit.getUser(headers);
    const settings = await getSettings(username);
    if (!settings) {
      res.status(404).send();
      return;
    }
    res.status(200).send(settings);
  } catch (e) {
    logger.error(`Error getting settings: ${e}`);
    res.status(500).send();
  }
};

exports.put = async ({ body: { contestReminders }, headers }, res) => {
  try {
    if (typeof contestReminders !== 'boolean') {
      res.status(400).send('contestReminders must be populated');
      return;
    }

    const username = await reddit.getUser(headers);
    const currentSettings = await getSettings(username);
    const settingsData = [{ contest_reminders: contestReminders, username }];
    let response;
    let status;
    if (!currentSettings) {
      [response] = await db.insert('users', settingsData, SETTINGS_FIELDS);
      status = 201;
    } else {
      [response] = await db.update(
        'users',
        settingsData,
        ['?username', 'contest_reminders'],
        SETTINGS_FIELDS,
      );
      status = 200;
    }
    res.status(status).send(response);
  } catch (e) {
    logger.error(`Error putting settings: ${e}`);
    res.status(500).send();
  }
};
