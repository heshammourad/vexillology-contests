/**
 * Fetch winning flags from each contest
 */

import { useSwrAuth } from '../common';

const useSwrHallOfFame = () => useSwrAuth('/hallOfFame');

export default useSwrHallOfFame;
