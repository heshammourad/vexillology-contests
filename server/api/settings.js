const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/SETTINGS');

const SETTINGS_FIELDS = ['contest_reminders'];

const getSettings = async (username) => {
  const [settings] = await db.select(
    `SELECT ${SETTINGS_FIELDS.join(', ')} FROM users WHERE username = $1`,
    [username],
  );
  return settings;
};

exports.get = async ({ username }, res) => {
  try {
    const settings = await getSettings(username);
    if (!settings) {
      res.status(404).send();
      return;
    }
    res.send(settings);
  } catch (e) {
    logger.error(`Error getting settings: ${e}`);
    res.status(500).send();
  }
};

exports.put = async ({ body: { contestReminders }, username }, res) => {
  try {
    if (typeof contestReminders !== 'boolean') {
      res.status(400).send('contestReminders must be populated');
      return;
    }

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
