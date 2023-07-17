// WARNING! All process.env values are strings, so check for 'true' or 'false'

const {
  ENV_LEVEL = 'prod',
  ENV_PORT,
  LOG_LEVEL: LOG_LEVEL_DOTENV,
  NODE_ENV,
  // OPEN_ALL_CONTESTS,
  TITLE = 'Vexillology Contests',
  USE_FIREBASE,
} = process.env;

const IS_DEV = NODE_ENV !== 'production';

const LOG_LEVEL = LOG_LEVEL_DOTENV || 'info';

const IS_FIREBASE_ON = !IS_DEV || USE_FIREBASE === 'true';

const FRONTEND_PORT = 3000;
const BACKEND_PORT = ENV_PORT || 5000;

module.exports = {
  BACKEND_PORT,
  CONTEST_ENV_LEVEL: ENV_LEVEL,
  FRONTEND_PORT,
  IS_DEV,
  IS_FIREBASE_ON,
  LOG_LEVEL,
  TITLE,
};
