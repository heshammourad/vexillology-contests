import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

import types from '../common/types';

function ArrowBackButton({
  color, onClick, state, to,
}) {
  return (
    <IconButton
      color={color}
      component={RouterLink}
      onClick={onClick}
      state={state}
      to={to}
      size="large"
    >
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
