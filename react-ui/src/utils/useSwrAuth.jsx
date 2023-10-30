/**
 * Fetch data
 */

import useSWR from 'swr';

import { useAuthState } from '../common';

const useSwrAuth = (path, options = {}) => {
  const [{
    refreshTokens, // Delete in future force quit
    accessTokens, // Delete in future force quit
    authTokens = { refreshTokens, accessTokens },
  }] = useAuthState();

  // https://swr.vercel.app/docs/arguments
  const uniqueKey = [path, authTokens];
  // fetcher is set as provider in App.jsx and calls getData in index.js
  const {
    data, error, isLoading, isValidating, mutate,
  } = useSWR(uniqueKey, options);

  // isValidating vs isLoading: https://swr.vercel.app/docs/advanced/understanding
  return {
    data: data || {},
    error,
    isLoading,
    isValidating,
    mutate,
  };
};

export default useSwrAuth;
