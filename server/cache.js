/**
 * Recall value from in-process cache
 * @param key
 * @param callback fetch value if not found
 * @param [expires] seconds until the value expires, 0 for never
 */

const { createLogger } = require('./logger');

const logger = createLogger('CACHE');

// Oldest entries are evicted past this size to bound memory
const MAX_ENTRIES = 5000;

// key -> { value: JSON string, expiresAt: ms timestamp or 0 }
const store = new Map();

const get = async (key, callback, expires = 0) => {
  logger.debug(`Looking up '${key}' in cache.`);
  const cached = store.get(key);
  if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
    logger.debug(`Found '${cached.value}' for '${key}'.`);
    // Parse on each read so callers can't mutate the cached copy
    return JSON.parse(cached.value);
  }
  store.delete(key);

  const newValue = await callback();

  if (newValue) {
    const value = JSON.stringify(newValue);
    logger.debug(`Setting '${key}' to '${value}' in cache`);
    store.set(key, {
      value,
      expiresAt: expires ? Date.now() + expires * 1000 : 0,
    });
    if (store.size > MAX_ENTRIES) {
      store.delete(store.keys().next().value);
    }
  }

  return newValue;
};

module.exports = { get };
