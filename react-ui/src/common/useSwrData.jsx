import addMinutes from 'date-fns/addMinutes';
import isFuture from 'date-fns/isFuture';
import { useState } from 'react';
import useSWR from 'swr';
import createPersistedState from 'use-persisted-state';

const usePersistentState = createPersistedState('data');
const useExpiresState = createPersistedState('expires');

const useSwrData = (key) => {
  const { data, mutate } = useSWR(key);
  const [isFetched, setFetched] = useState(!!data);
  const [cache, setCache] = usePersistentState({});
  const [expires, setExpires] = useExpiresState({});

  if (!isFetched) {
    setTimeout(async () => {
      const expiryDate = expires[key];
      if (expiryDate && isFuture(new Date(expiryDate)) && cache[key]) {
        mutate(cache[key], false);
        return;
      }

      const response = await mutate();
      setCache({ ...cache, [key]: response });
      setExpires({ ...expires, [key]: addMinutes(new Date(), 15) });
    }, 200);
    setFetched(true);
  }

  return data;
};

export default useSwrData;
