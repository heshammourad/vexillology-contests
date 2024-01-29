/**
 * Fetch winning flags from each contest
 */

import useSwrAuth from './useSwrAuth';

const useSwrModReview = () => useSwrAuth('/mod/reviewSubmissions');

export default useSwrModReview;
