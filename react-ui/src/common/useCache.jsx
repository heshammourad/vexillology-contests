/**
 * Manage local cache to all data
 */

import addMinutes from 'date-fns/addMinutes';
import isFuture from 'date-fns/isFuture';
import createPersistedState from 'use-persisted-state';

const useCacheState = createPersistedState('data');
const useExpiresState = createPersistedState('expires');

const useCache = (key) => {
  const [cache, setCache] = useCacheState({});
  const [expires, setExpires] = useExpiresState({});

  const getData = () => {
    const data = cache[key];
    return data && isFuture(new Date(expires[key])) ? data : null;
  };

  const updateCache = (data) => {
    setCache({ ...cache, [key]: data });
    setExpires({ ...expires, [key]: addMinutes(new Date(), 10) });
  };

  const clearCache = () => {
    setCache({});
    setExpires({});
  };

  return [getData, updateCache, clearCache];
};

export default useCache;
