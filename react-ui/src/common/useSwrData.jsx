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
  const { data, mutate } = useSWR([key, { accessToken, refreshToken }]);
  const [isFetched, setFetched] = useState(!!data);
  const [cache, setCache] = usePersistentState({});
  const [expires, setExpires] = useExpiresState({});

  useEffect(() => {
    setCache({});
    setExpires({});
  }, [isLoggedIn]);

  if (data && !allowRefresh) {
    return data;
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
        setCache({ ...cache, [key]: response });
        setExpires({ ...expires, [key]: addMinutes(new Date(), 15) });
      }
    }, 200);
    setFetched(true);
  }

  return data;
};

export default useSwrData;
