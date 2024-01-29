/**
 * Get all contests
 */

import useSwrAuth from './useSwrAuth';

const useSwrContests = () => useSwrAuth('/contests');

export default useSwrContests;
