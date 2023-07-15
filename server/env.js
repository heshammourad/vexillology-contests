// WARNING! All process.env values are strings, so check for 'true' or 'false'

const {
  NODE_ENV,
  // OPEN_ALL_CONTESTS,
  USE_FIREBASE,
  ENV_LEVEL,
  LOG_LEVEL: LOG_LEVEL_DOTENV,
  ENV_PORT,
} = process.env;

const IS_DEV = NODE_ENV !== 'production';
const TITLE = 'Vexillology Contests';

const CONTEST_ENV_LEVEL = ENV_LEVEL || 'prod';

const LOG_LEVEL = LOG_LEVEL_DOTENV || 'info';

const IS_FIREBASE_ON = !IS_DEV || USE_FIREBASE === 'true';

const FRONTEND_PORT = 3000;
const BACKEND_PORT = ENV_PORT || 5000;

module.exports = {
  IS_DEV,
  TITLE,
  CONTEST_ENV_LEVEL,
  LOG_LEVEL,
  IS_FIREBASE_ON,
  FRONTEND_PORT,
  BACKEND_PORT,
};
