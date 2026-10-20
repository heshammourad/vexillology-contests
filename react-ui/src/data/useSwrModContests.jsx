/**
 * Get every contest a moderator can still manage: current, upcoming, or awaiting certification
 */

import useSwrAuth from './useSwrAuth';

const useSwrModContests = () => useSwrAuth('/mod/contests');

export default useSwrModContests;
