const memjs = require('memjs');

const { createLogger } = require('./logger');

const logger = createLogger('MEMCACHE');

const mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
  failover: true,
  timeout: process.env.MEMCACHIER_TIMEOUT || 1,
  keepAlive: true,
  username: process.env.MEMCACHIER_USERNAME,
  password: process.env.MEMCACHIER_PASSWORD,
});

const get = async (key, callback, expires = 0) => {
  logger.debug(`Looking up '${key}' in cache.`);
  try {
    const { value } = await mc.get(key);
    if (value) {
      logger.debug(`Found '${value}' for '${key}'.`);
      return JSON.parse(value);
    }
  } catch (err) {
    logger.error(`Error looking up '${key}' in cache: ${err}`);
  }

  const newValue = await callback();

  try {
    if (newValue) {
      const valueObj = JSON.stringify(newValue);
      logger.debug(`Setting '${key}' to '${valueObj}' in cache`);
      mc.set(key, valueObj, { expires });
    }
  } catch (err) {
    logger.error(`Error setting '${key}' in cache: ${err}`);
  }

  return newValue;
};

module.exports = { get };
