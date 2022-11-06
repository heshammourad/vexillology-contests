import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

import types from '../common/types';

function ArrowBackButton({
  color, onClick, state, to,
}) {
  return (
    <IconButton color={color} component={RouterLink} onClick={onClick} state={state} to={to}>
      <ArrowBackIcon />
    </IconButton>
  );
}

ArrowBackButton.propTypes = {
  color: PropTypes.string,
  onClick: PropTypes.func,
  state: PropTypes.shape({}),
  to: types.to.isRequired,
};

ArrowBackButton.defaultProps = {
  color: 'default',
  onClick: () => {},
  state: {},
};

export default ArrowBackButton;
