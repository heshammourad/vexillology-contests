import PropTypes from 'prop-types';

import { useSwrData } from '../common';

function Experiment({ children, name }) {
  const {
    data: { experiments = {} },
  } = useSwrData('/init');
  return experiments[name] ? children : null;
}

Experiment.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
};

export default Experiment;
