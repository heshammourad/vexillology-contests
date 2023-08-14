/**
 * Fetch data
 * ??? mutate(cachedData, false); vs mutate(cachedData, {revalidate:false});
 * ??? Consider a cache provider for persistence
 */

import { useEffect, useState } from 'react';
import useSWR from 'swr';

import useAuthState from './useAuthState';
import useCache from './useCache';

const REVALIDATION_DELAY = 200; // ms

const getOptions = (path) => {
  switch (path) {
    /**
     * Init fetches the following:
     * * experiments
     * * moderator
     * * submissionsToReview
     * * development title (local, staging, production)
     * * webAppClientId
     */
    case '/init':
      // Limit '/init' network calls to >10 minute intervals
      return {
        dedupingInterval: 10 * 60 * 1000, // 10 minutes
      };
    default: {
      return {};
    }
  }
};

const useSwrData = (path, revalidateOnMount = true) => {
  const [getData, updateCache, clearCache] = useCache(path);
  const [{ accessToken, isLoggedIn, refreshToken }] = useAuthState();

  // https://swr.vercel.app/docs/arguments
  const uniqueKey = [path, { accessToken, refreshToken }];
  // fetcher is set as provider in App.jsx and calls getData in index.js
  const {
    data, error, isValidating, isLoading, mutate,
  } = useSWR(uniqueKey, { ...getOptions(path), revalidateOnMount });

  const [prevLoggedIn, setLoggedIn] = useState(isLoggedIn);
  const [isFetched, setFetched] = useState(!!data);

  // Set cache
  useEffect(() => {
    if (revalidateOnMount || !data) {
      return;
    }

    updateCache(data);
  }, [data]);

  // Clear cache on change of login status
  useEffect(() => {
    if (isLoggedIn === prevLoggedIn) {
      return;
    }
    clearCache();
    setLoggedIn(isLoggedIn);
  }, [isLoggedIn]);

  // Only fetch if no cache
  if (!revalidateOnMount) {
    const cachedData = getData();
    if (cachedData) {
      if (!data) {
        // Update client cache with persisted cache data
        mutate(cachedData, false);
      }
      return { data: cachedData };
    }

    // Revalidation / fetch
    if (!isFetched) {
      setFetched(true);
      setTimeout(async () => {
        const response = await mutate();
        if (response) {
          updateCache(response);
        }
      }, REVALIDATION_DELAY);
    }
  }

  // isValidating vs isLoading: https://swr.vercel.app/docs/advanced/understanding
  return {
    data: data || {},
    error: error?.response,
    isValidating,
    isLoading,
    mutate,
  };
};

export default useSwrData;
