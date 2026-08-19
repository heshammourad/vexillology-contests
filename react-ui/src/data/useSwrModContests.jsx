/**
 * Get all current and upcoming contests (moderator only)
 */

import useSwrAuth from './useSwrAuth';

const useSwrModContests = () => useSwrAuth('/mod/contests');

export default useSwrModContests;
