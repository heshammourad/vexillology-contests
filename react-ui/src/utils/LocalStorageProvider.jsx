/**
 * Local Storage persistent cache
 * https://swr.vercel.app/docs/advanced/cache#localstorage-based-persistent-cache
 * @returns map of past session
 */

import { START_WITHOUT_CACHE } from '../env';

export default function localStorageProvider() {
  if (START_WITHOUT_CACHE) {
    return new Map();
  }

  // When initializing, we restore the data from `localStorage` into a map.
  const map = new Map(JSON.parse(localStorage.getItem('app-cache') || '[]'));

  // Before unloading the app, we write back all the data into `localStorage`.
  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem('app-cache', appCache);
  });

  // We still use the map for write & read for performance.
  return map;
}
