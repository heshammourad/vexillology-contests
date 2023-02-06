import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

import { useComponentsState, useSwrData } from '../common';

function AppHelmet() {
  const [{ title = 'Vexillology Contests' }] = useSwrData('/init');
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
