/**
 * Recall value from in-process cache
 * @param key
 * @param callback fetch value if not found
 * @param [expires] seconds until the value expires, 0 for never
 */

const { createLogger } = require('./logger');

const logger = createLogger('CACHE');

// Least recently used entries are evicted past this size to bound memory
const MAX_ENTRIES = 5000;

// Per process, so each cluster worker (WEB_CONCURRENCY) keeps its own copy.
// key -> { value: JSON string, expiresAt: ms timestamp or 0 }
const store = new Map();
// key -> promise of a fetch in progress, so concurrent misses share one fetch
const pending = new Map();

const fetchAndStore = async (key, callback, expires) => {
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
    return value;
  }

  return newValue;
};

const get = async (key, callback, expires = 0) => {
  logger.debug(`Looking up '${key}' in cache.`);
  const cached = store.get(key);
  store.delete(key);
  if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
    logger.debug(`Found '${cached.value}' for '${key}'.`);
    // Re-insert so the Map's insertion order tracks recency
    store.set(key, cached);
    // Parse on each read so callers can't mutate the cached copy
    return JSON.parse(cached.value);
  }

  if (!pending.has(key)) {
    pending.set(
      key,
      fetchAndStore(key, callback, expires).finally(() => pending.delete(key)),
    );
  }
  const value = await pending.get(key);
  // Each caller parses its own copy; falsy fetch results pass through as-is
  return value ? JSON.parse(value) : value;
};

module.exports = { get };
