// WARNING! All process.env values are strings, so check for 'true' or 'false'

const { NODE_ENV } = process.env;

const IS_DEV = NODE_ENV !== 'production';

/**
 * DEVELOPER VARIALBES
 * All variables should be designed to default to "false" in production mode
 * Any changes must be added to the export statement below and communicated to the team
 */

const DEFAULT_DEV_VARIABLES = {
  // Developer bar to quickly change database for frequent needs
  // Change mod status and create / change status of dev contest
  VIEW_DEV_BAR: false,
  // Clear sticky cache
  // Might be best compile time...
  START_WITHOUT_CACHE: false,
};

// END DEVELOPER VARIABLES ***************************************

let devVariables = {};
try {
  // https://eslint.org/docs/latest/rules/global-require#when-not-to-use-it
  // eslint-disable-next-line global-require
  const MY_DEV_VARIABLES = require('./env.personal');
  devVariables = MY_DEV_VARIABLES.default || MY_DEV_VARIABLES;
} catch (error) {
  // No need to handle error
}

// Ensure all DEFAULT_DEV_VARIABLE fields are in the final object and false if in production
const DEV_VARIABLES = Object.keys(DEFAULT_DEV_VARIABLES).reduce((acc, key) => ({
  ...acc,
  [key]: (devVariables[key] ?? false) && IS_DEV,
}), {});

export const {
  VIEW_DEV_BAR,
  START_WITHOUT_CACHE,
} = DEV_VARIABLES;

export {
  IS_DEV,
};
