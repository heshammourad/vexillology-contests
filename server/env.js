// WARNING! All process.env values are strings, so check for 'true' or 'false'

const {
  ENV_LEVEL = 'prod',
  ENV_PORT,
  LOG_LEVEL: LOG_LEVEL_DOTENV,
  NODE_ENV,
  TITLE = 'Vexillology Contests',
} = process.env;

// ONLY CHANGE THESE VARIABLES
// (or those in dotenv, which require restart)
const OPEN_ALL_CONTESTS = true;
const HIDE_FIREBASE = false;
const VIEW_UNAUTHENTICATED = false;

const IS_DEV = NODE_ENV !== 'production';

const IS_CONTESTS_OPENED = IS_DEV && OPEN_ALL_CONTESTS;
const IS_FIREBASE_OFF = IS_DEV && HIDE_FIREBASE;
const IS_UNAUTHENTICATED_VIEW = IS_DEV && VIEW_UNAUTHENTICATED;

const LOG_LEVEL = LOG_LEVEL_DOTENV || 'info';

const FRONTEND_PORT = 3000;
const BACKEND_PORT = ENV_PORT || 5000;

module.exports = {
  BACKEND_PORT,
  CONTEST_ENV_LEVEL: ENV_LEVEL,
  FRONTEND_PORT,
  IS_DEV,
  IS_CONTESTS_OPENED,
  IS_FIREBASE_OFF,
  IS_UNAUTHENTICATED_VIEW,
  LOG_LEVEL,
  TITLE,
};
