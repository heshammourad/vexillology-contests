// Copy this file into the same folder and rename it env.personal.js
// Change any boolean values to set your own environment

const MY_DEV_VARIABLES = {
  // Triggers default reddit snoowrap, only for admin
  IS_UNAUTHENTICATED_VIEW: false,
  // Fetches the "dev" contest as the current frontpage contest
  ALLOW_DEV_CONTEST: true,
  // Ignore flags with pending status (so dev contest can enter voting or results status)
  IGNORE_PENDING_DEV: true,
};

module.exports = { MY_DEV_VARIABLES };
