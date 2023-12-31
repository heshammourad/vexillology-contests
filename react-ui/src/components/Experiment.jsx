import PropTypes from 'prop-types';

import useSwrInit from '../utils/useSwrInit';

function Experiment({ children, name }) {
  const {
    data: { experiments = {} },
  } = useSwrInit();
  return experiments[name] ? children : null;
}

Experiment.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
};

export default Experiment;
