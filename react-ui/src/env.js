// WARNING! All process.env values are strings, so check for 'true' or 'false'

const { NODE_ENV } = process.env;

const IS_DEV = NODE_ENV !== 'production';

/**
 * DEVELOPER VARIALBES
 */

// Developer bar to quickly change database for frequent needs
// Change mod status and create / change status of dev contest
const VIEW_DEV_BAR = true && IS_DEV;
// Clear sticky cache
const START_WITHOUT_CACHE = false && IS_DEV;

// END DEVELOPER VARIABLES ***************************************

export {
  IS_DEV,
  VIEW_DEV_BAR,
  START_WITHOUT_CACHE,
};
