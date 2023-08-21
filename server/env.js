// WARNING! All process.env values are strings, so check for 'true' or 'false'

const {
  DATABASE_SSL,
  ENV_LEVEL = 'prod',
  FIREBASE_PRIVATE_KEY = false,
  LOG_LEVEL: LOG_LEVEL_DOTENV,
  NODE_ENV,
  PORT,
  TITLE = 'Vexillology Contests',
} = process.env;

// ONLY CHANGE THESE VARIABLES
// (or those in dotenv, which require restart)
const OPEN_ALL_CONTESTS = true;
const VIEW_UNAUTHENTICATED = false;

const IS_DEV = NODE_ENV !== 'production';

const IS_CONTESTS_OPENED = IS_DEV && OPEN_ALL_CONTESTS;
const IS_FIREBASE_OFF = IS_DEV && !FIREBASE_PRIVATE_KEY;
const IS_UNAUTHENTICATED_VIEW = IS_DEV && VIEW_UNAUTHENTICATED;

const LOG_LEVEL = LOG_LEVEL_DOTENV || 'info';

const FRONTEND_PORT = 3000;
const BACKEND_PORT = PORT || 5000;

module.exports = {
  BACKEND_PORT,
  CONTEST_ENV_LEVEL: ENV_LEVEL,
  DATABASE_SSL: DATABASE_SSL ? DATABASE_SSL === 'true' : true,
  FRONTEND_PORT,
  IS_DEV,
  IS_CONTESTS_OPENED,
  IS_FIREBASE_OFF,
  IS_UNAUTHENTICATED_VIEW,
  LOG_LEVEL,
  TITLE,
};
