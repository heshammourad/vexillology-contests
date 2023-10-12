/* eslint-disable import/prefer-default-export */
// WARNING! All process.env values are strings, so check for 'true' or 'false'

// You will want to create you own dotenv file
// Ask other developers for their (redacted) version to ensure you have all variables
const { NODE_ENV } = process.env;

/**
 * DEVELOPER VARIALBES
 * Only change these variables
 * (or the variables in dotenv, which require restart)
 */

const VIEW_DEV_BAR = true;
const START_WITHOUT_CACHE = false;

// END DEVELOPER VARIABLES ***************************************

const IS_DEV = NODE_ENV !== 'production';
const IS_DEV_BAR = IS_DEV && VIEW_DEV_BAR;

export {
    IS_DEV,
    IS_DEV_BAR,
    START_WITHOUT_CACHE,
};
