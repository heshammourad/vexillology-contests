// WARNING! All process.env values are strings, so check for 'true' or 'false'

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
 */

const DEV_VARIABLES = {
  // Triggers default reddit snoowrap, only for admin
  IS_UNAUTHENTICATED_VIEW: false,
  // Fetches the "dev" contest as the current frontpage contest
  ALLOW_DEV_CONTEST: false,
  // Ignore flags with pending status (so dev contest can enter voting or results status)
  IGNORE_PENDING_DEV: false,
};

const DEV_ENV_EXPORT = Object.entries(DEV_VARIABLES).reduce((acc, [key, value]) => ({
  ...acc,
  [key]: value && IS_DEV,
}), {});

// END DEVELOPER VARIABLES ***************************************

// Allows developers without FIREBASE_PRIVATE_KEY to run app locally
const IS_FIREBASE_OFF = !FIREBASE_PRIVATE_KEY && IS_DEV;

const LOG_LEVEL = LOG_LEVEL_DOTENV || 'info';

const FRONTEND_PORT = 3000;
const BACKEND_PORT = PORT || 5000;

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
