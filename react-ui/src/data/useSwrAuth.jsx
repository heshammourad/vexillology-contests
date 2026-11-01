/**
 * Fetch data
 */

import useSWR from 'swr';

import useAuthState from '../common/useAuthState';

const useSwrAuth = (path, options = {}) => {
  const [{ authTokens }] = useAuthState();

  // https://swr.vercel.app/docs/arguments
  // A falsy path means "don't fetch yet", which SWR expresses as a null key.
  const uniqueKey = path ? [path, authTokens] : null;
  // fetcher is set as provider in App.jsx and calls getData in index.js
  const {
    data, error, isLoading, isValidating, mutate,
  } = useSWR(
    uniqueKey,
    options,
  );

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
