/**
 * Get data from current contest, or override with specific contest
 */

import useContestId from './useContestId';
import useSwrAuth from './useSwrAuth';

// Set default deduping interval to 15min to avoid refetching contest data when EntryModal is
// opened. This allows two-thirds of voters to complete voting before the data is fetched again
// and the order gets changed.
const DEDUPING_INTERVAL = 900_000;

const useSwrContest = ({ makeRequest = true, options = {}, overrideId } = {}) => {
  const contestId = overrideId || useContestId();
  const apiPath = `/contests/${contestId}`;

  const {
    data = {},
    error: e,
    mutate,
    ...rest
  } = useSwrAuth(makeRequest && apiPath, {
    dedupingInterval: DEDUPING_INTERVAL,
    ...options,
  });

  const error = e?.response;

  return {
    data,
    error,
    mutate,
    ...rest,
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
