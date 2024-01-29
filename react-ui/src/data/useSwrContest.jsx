/**
 * Get data from current contest, or override with specific contest
 */

import { useEffect } from 'react';

import useContestId from './useContestId';
import useSwrAuth from './useSwrAuth';

// revalidateIfStale = false
const useSwrContest = (overrideId, revalidateOnMount = false) => {
  const contestId = overrideId || useContestId();
  const apiPath = `/contests/${contestId}`;

  const {
    data = {},
    error: e,
    mutate,
    ...rest
  } = useSwrAuth(apiPath, { revalidateOnMount });

  useEffect(() => {
    mutate();
  }, [contestId]);

  const error = e?.response;

  return {
    data, error, mutate, ...rest,
  };

  /**
   * object rest
   * @arg data
   * @arg isLoading
   * @arg isValidating
   * @arg mutate
   */
};

export default useSwrContest;
