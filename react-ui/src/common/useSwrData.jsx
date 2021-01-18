/* eslint-disable no-console */
import { useState } from 'react';
import useSWR from 'swr';

const useSwrData = (key) => {
  const { data, mutate } = useSWR(key);
  const [isFetched, setFetched] = useState(!!data);

  if (!isFetched) {
    setTimeout(mutate, 200);
    setFetched(true);
  }

  return data;
};

export default useSwrData;
