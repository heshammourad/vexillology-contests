import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import useSwrAuth from '../data/useSwrAuth';

import useAuthState from './useAuthState';

/**
 * Hook to check if the current user is banned and redirect them if necessary
 * @param {boolean} shouldRedirect - Whether to automatically redirect to ban page if banned
 * @returns {Object} - Object containing ban status and loading state
 */
const useBanStatus = (shouldRedirect = true) => {
  const [{ isLoggedIn }] = useAuthState();
  const navigate = useNavigate();

  // Use SWR to fetch ban status - this handles caching and authentication
  const {
    data: banStatus,
    error,
    isLoading,
  } = useSwrAuth(isLoggedIn ? '/checkBanStatus' : null);

  useEffect(() => {
    // Redirect to ban page if user is banned and redirect is enabled
    if (shouldRedirect && banStatus?.isBanned) {
      navigate('/banned', { replace: true });
    }
  }, [banStatus?.isBanned, shouldRedirect, navigate]);

  return {
    banStatus,
    isLoading,
    error,
    isBanned: banStatus?.isBanned || false,
    activeBans: banStatus?.activeBans || [],
  };
};

export default useBanStatus;
