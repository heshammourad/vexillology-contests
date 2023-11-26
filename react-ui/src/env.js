/* eslint-disable import/prefer-default-export */
// WARNING! All process.env values are strings, so check for 'true' or 'false'

// You will want to create you own dotenv file
// Ask other developers for their (redacted) version to ensure you have all variables
const { NODE_ENV } = process.env;

const IS_DEV = NODE_ENV !== 'production';

/**
 * DEVELOPER VARIALBES
 * Only change these variables
 * (or the variables in dotenv, which require restart)
 */

const VIEW_DEV_BAR = true && IS_DEV;
const START_WITHOUT_CACHE = false && IS_DEV;

// END DEVELOPER VARIABLES ***************************************

export {
  IS_DEV,
  VIEW_DEV_BAR,
  START_WITHOUT_CACHE,
};
