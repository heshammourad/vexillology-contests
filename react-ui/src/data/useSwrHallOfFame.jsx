/**
 * Fetch winning flags from each contest
 */

import useSwrAuth from './useSwrAuth';

const useSwrHallOfFame = () => useSwrAuth('/hallOfFame');

export default useSwrHallOfFame;
