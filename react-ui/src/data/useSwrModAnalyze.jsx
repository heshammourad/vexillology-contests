/**
 * Fetch winning flags from each contest
 */

import useSwrAuth from './useSwrAuth';

const useSwrModAnalyze = (contestId) => useSwrAuth(`/mod/analyzeVotes/${contestId}`);

export default useSwrModAnalyze;
