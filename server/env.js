// WARNING! All process.env values are strings, so check for 'true' or 'false'

// You will want to create you own dotenv file
// Ask other developers for their (redacted) version to ensure you have all variables
const {
  DATABASE_SSL,
  ENV_LEVEL = 'dev',
  FIREBASE_PRIVATE_KEY = false,
  LOG_LEVEL: LOG_LEVEL_DOTENV,
  NODE_ENV,
  PORT,
  TITLE = 'Vexillology Contests',
} = process.env;

const IS_DEV = NODE_ENV !== 'production';

/**
 * DEVELOPER VARIALBES
 * Only change these variables
 * (or the variables in dotenv, which require restart)
 */

const DEV_VARIABLES = {
  IS_UNAUTHENTICATED_VIEW: false,
  ALLOW_DEV_CONTEST: true,
  IGNORE_PENDING_DEV: true,
};

// END DEVELOPER VARIABLES ***************************************

// Allows developers without FIREBASE_PRIVATE_KEY to run app locally
const IS_FIREBASE_OFF = !FIREBASE_PRIVATE_KEY && IS_DEV;
// Allows developers to view as unauthenticated user without signing out

const LOG_LEVEL = LOG_LEVEL_DOTENV || 'info';

const FRONTEND_PORT = 3000;
const BACKEND_PORT = PORT || 5000;

const DEV_ENV_EXPORT = Object.entries(DEV_VARIABLES).reduce((acc, [key, value]) => ({
  ...acc,
  [key]: value && IS_DEV,
}), {});

module.exports = {
  ...DEV_ENV_EXPORT,
  BACKEND_PORT,
  CONTEST_ENV_LEVEL: ENV_LEVEL,
  DATABASE_SSL: DATABASE_SSL ? DATABASE_SSL === 'true' : true,
  FRONTEND_PORT,
  IS_DEV,
  IS_FIREBASE_OFF,
  LOG_LEVEL,
  TITLE,
};
