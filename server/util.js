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

/**
 * Reproducible yet random hash function
 * Concatenates username and entryId for distinct hash
 * @param {string} username - The username
 * @param {string} entryId - The entry ID
 * @returns {number} - 32-bit integer hash
 */
const getHash = (username, entryId) => {
  const seed = username + entryId;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

module.exports = { camelizeObjectKeys, generateImagePath, getHash };
