/**
 * Fetch winning flags from each contest
 */

import useSwrAuth from './useSwrAuth';

const useSwrSubmission = () => useSwrAuth('/submission');

export default useSwrSubmission;
