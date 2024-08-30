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
 * DEVELOPER VARIABLES
 * All variables should be designed to default to "false" in production mode
 */
const DEFAULT_DEV_VARIABLES = {
  // Triggers default reddit snoowrap, only for admin
  IS_UNAUTHENTICATED_VIEW: false,
  // Fetches the "dev" contest as the current frontpage contest
  ALLOW_DEV_CONTEST: false,
  // Ignore flags with pending status (so dev contest can enter voting or results status)
  IGNORE_PENDING_DEV: false,
};

let devVariables = {};
try {
  // https://eslint.org/docs/latest/rules/global-require#when-not-to-use-it
  // eslint-disable-next-line global-require, import/no-unresolved
  const { MY_DEV_VARIABLES } = require('./env.personal');
  devVariables = MY_DEV_VARIABLES.default || MY_DEV_VARIABLES;
} catch (error) {
  // No need to handle error
}

// Ensure all DEFAULT_DEV_VARIABLE fields are in the final object and false if in production
const DEV_VARIABLES = Object.keys(DEFAULT_DEV_VARIABLES).reduce(
  (acc, key) => ({
    ...acc,
    [key]: (devVariables[key] ?? false) && IS_DEV,
  }),
  {},
);

// END DEVELOPER VARIABLES ***************************************

// Allows developers without FIREBASE_PRIVATE_KEY to run app locally
const IS_FIREBASE_OFF = !FIREBASE_PRIVATE_KEY && IS_DEV;

const LOG_LEVEL = LOG_LEVEL_DOTENV || 'info';

const FRONTEND_PORT = 3000;
const BACKEND_PORT = PORT || 5000;

module.exports = {
  ...DEV_VARIABLES,
  BACKEND_PORT,
  CONTEST_ENV_LEVEL: ENV_LEVEL,
  DATABASE_SSL: DATABASE_SSL ? DATABASE_SSL === 'true' : true,
  FRONTEND_PORT,
  IS_DEV,
  IS_FIREBASE_OFF,
  LOG_LEVEL,
  TITLE,
};
