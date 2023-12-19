/**
 * Initial call to server. Fetches:
 * * experiments
 * * moderator
 * * submissionsToReview
 * * development title (local, staging, production)
 * * webAppClientId
 */

import { useSwrAuth } from '../common';

// Limit '/init' network calls to >10 minute intervals
const DEDUPING_INTERVAL = 600000;

const useSwrInit = () => useSwrAuth('/init', { dedupingInterval: DEDUPING_INTERVAL });

export default useSwrInit;
