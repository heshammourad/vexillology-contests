/**
 * Manage HTML head and metadata
 * @returns {object} HTML tags
 * see https://github.com/nfl/react-helmet
 */

import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

import { useComponentsState } from '../common';
import useSwrInit from '../data/useSwrInit';

function AppHelmet() {
  const {
    data: { title = 'Vexillology Contests' },
  } = useSwrInit();
  const location = useLocation();
  const setComponentsState = useComponentsState()[1];

  useEffect(() => {
    setComponentsState();
  }, [location]);

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
}

export default AppHelmet;
