import useScrollTrigger from '@mui/material/useScrollTrigger';
import PropTypes from 'prop-types';
import { cloneElement } from 'react';

function ElevationScroll({ children }) {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return cloneElement(children, {
    elevation: trigger ? 4 : 0,
  });
}

ElevationScroll.propTypes = {
  children: PropTypes.element.isRequired,
};

export default ElevationScroll;
