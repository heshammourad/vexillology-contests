/**
 * Get data from current contest, or override with specific contest
 */

import { IS_SUBMISSION_VIEW, IS_VOTING_VIEW } from '../env';

import useContestId from './useContestId';
import useSwrAuth from './useSwrAuth';

// revalidateIfStale = false
const useSwrContest = (revalidateOnMount = false) => {
  const contestId = useContestId();
  const apiPath = `/contests/${contestId}`;

  const { data = {}, error: e, ...rest } = useSwrAuth(apiPath, { ...revalidateOnMount });

  const error = e?.response;

  if (!Object.keys(data).length) {
    return { data, error, ...rest };
  }

  const isContestMode = !IS_SUBMISSION_VIEW && (data.isContestMode || IS_VOTING_VIEW);
  const submissionWindowOpen = data.submissionWindowOpen || IS_SUBMISSION_VIEW;

  return {
    data: {
      ...data,
      isContestMode,
      submissionWindowOpen,
    },
    error,
    ...rest,
  };
  /**
   * object rest
   * @arg isLoading
   * @arg isValidating
   * @arg mutate
   */
};

export default useSwrContest;
