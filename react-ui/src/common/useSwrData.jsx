import addMinutes from 'date-fns/addMinutes';
import isFuture from 'date-fns/isFuture';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import createPersistedState from 'use-persisted-state';

import useAuthState from './useAuthState';

const usePersistentState = createPersistedState('data');
const useExpiresState = createPersistedState('expires');

const useSwrData = (key, allowRefresh = true) => {
  const [{ accessToken, isLoggedIn, refreshToken }] = useAuthState();
  const { data, error, mutate } = useSWR([key, { accessToken, refreshToken }]);
  const [prevLoggedIn, setLoggedIn] = useState(isLoggedIn);
  const [isFetched, setFetched] = useState(!!data);
  const [cache, setCache] = usePersistentState({});
  const [expires, setExpires] = useExpiresState({});

  useEffect(() => {
    if (isLoggedIn === prevLoggedIn) {
      return;
    }
    setCache({});
    setExpires({});
    setLoggedIn(isLoggedIn);
  }, [isLoggedIn]);

  const updateCache = (cacheData) => {
    setCache({ ...cache, [key]: cacheData });
    setExpires({ ...expires, [key]: addMinutes(new Date(), 10) });
  };

  if (data && !allowRefresh) {
    return [{ data }, updateCache];
  }

  if (!isFetched) {
    setTimeout(async () => {
      const expiryDate = expires[key];
      if (expiryDate && isFuture(new Date(expiryDate)) && cache[key]) {
        mutate(cache[key], false);
        return;
      }

      const response = await mutate();
      if (response) {
        updateCache(response);
      }
    }, 200);
    setFetched(true);
  }

  return [{ data: data || {}, error }, updateCache];
};

export default useSwrData;
