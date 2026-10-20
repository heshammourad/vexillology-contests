/**
 * Get a month's default contest schedule and bounds, plus the contests around it
 * (moderator only). Fetches nothing without a month.
 */

import useSwrAuth from './useSwrAuth';

/**
 * @param {string} month - 'YYYY-MM'.
 * @param {string} [excludeId] - The contest being edited, left out of the neighbour lookups.
 */
const useSwrModContestSchedule = (month, excludeId) => {
  const query = new URLSearchParams({
    date: `${month}-01`,
    ...(excludeId && { excludeId }),
  });
  return useSwrAuth(month && `/mod/contestSchedule?${query}`);
};

export default useSwrModContestSchedule;
