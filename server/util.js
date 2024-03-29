// ??? why not just return tmp instead of overwriting obj?

const camelCase = require('lodash/camelCase');

const { createLogger } = require('./logger');

const logger = createLogger('UTIL');

const camelizeObjectKeys = (obj) => {
  logger.debug(`Camelizing ${JSON.stringify(obj)}`);
  const tmp = obj[0];
  if (!tmp) {
    logger.debug('No object keys to camilize.');
    return;
  }

  Object.keys(tmp).forEach((prop) => {
    const camel = camelCase(prop);
    if (!(camel in tmp)) {
      for (let i = 0; i < obj.length; i += 1) {
        const o = obj[i];
        o[camel] = o[prop];
        delete o[prop];
      }
    }
  });
  logger.debug(`Camelized to ${JSON.stringify(obj)}`);
};

/**
 * Helper function to generate the image path on the server from the image ID.
 * @param {string} id - ID of the image.
 * @returns The image path on the server.
 */
const generateImagePath = (id) => `/i/${id}.png`;

module.exports = { camelizeObjectKeys, generateImagePath };
