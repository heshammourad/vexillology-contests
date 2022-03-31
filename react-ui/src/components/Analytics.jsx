import { logEvent } from 'firebase/analytics';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { analytics } from '../common';

const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    logEvent(analytics, 'page_view', { page_path: location.pathname });
  }, [location]);

  return null;
};

export default Analytics;
