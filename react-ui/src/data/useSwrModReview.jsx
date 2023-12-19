/**
 * Fetch winning flags from each contest
 */

import { useSwrAuth } from '../common';

const useSwrModReview = () => useSwrAuth('/mod/reviewSubmissions');

export default useSwrModReview;
