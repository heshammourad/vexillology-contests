/**
 * Get all contests
 */

import { useSwrAuth } from '../common';

const useSwrContests = () => useSwrAuth('/contests');

export default useSwrContests;
