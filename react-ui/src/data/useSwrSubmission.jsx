/**
 * Fetch winning flags from each contest
 */

import { useSwrAuth } from '../common';

const useSwrSubmission = () => useSwrAuth('/submission');

export default useSwrSubmission;
