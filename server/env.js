// WARNING! All process.env values are strings, so check for 'true' or 'false'

// You will want to create you own dotenv file
// Ask other developers for their (redacted) version to ensure you have all variables
const {
  DATABASE_SSL,
  ENV_LEVEL = 'prod',
  FIREBASE_PRIVATE_KEY = false,
  LOG_LEVEL: LOG_LEVEL_DOTENV,
  NODE_ENV,
  PORT,
  TITLE = 'Vexillology Contests',
} = process.env;

/**
 * DEVELOPER VARIALBES
 * Only change these variables
 * (or the variables in dotenv, which require restart)
 */

const ALLOW_UNAUTHENTICATED = false;
const ALLOW_SUBMISSION = false;
const ALLOW_VOTING = true;

// END DEVELOPER VARIABLES ***************************************

const IS_DEV = NODE_ENV !== 'production';

// Allows developers without FIREBASE_PRIVATE_KEY to run app locally
const IS_FIREBASE_OFF = IS_DEV && !FIREBASE_PRIVATE_KEY;
// Allows developers to view as unauthenticated user without signing out
const IS_UNAUTHENTICATED_VIEW = IS_DEV && ALLOW_UNAUTHENTICATED;
const IS_SUBMISSION_VIEW = IS_DEV && ALLOW_SUBMISSION;
const IS_VOTING_VIEW = IS_DEV && !IS_SUBMISSION_VIEW && ALLOW_VOTING;

const LOG_LEVEL = LOG_LEVEL_DOTENV || 'info';

const FRONTEND_PORT = 3000;
const BACKEND_PORT = PORT || 5000;

module.exports = {
  BACKEND_PORT,
  CONTEST_ENV_LEVEL: ENV_LEVEL,
  DATABASE_SSL: DATABASE_SSL ? DATABASE_SSL === 'true' : true,
  FRONTEND_PORT,
  IS_DEV,
  IS_FIREBASE_OFF,
  IS_SUBMISSION_VIEW,
  IS_VOTING_VIEW,
  IS_UNAUTHENTICATED_VIEW,
  LOG_LEVEL,
  TITLE,
};
