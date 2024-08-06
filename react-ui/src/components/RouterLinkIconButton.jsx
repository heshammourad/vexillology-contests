import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Close from '@material-ui/icons/Close';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import types from '../common/types';

function RouterLinkIconButton({
  color, onClick, state, to, icon = 'arrowback',
}) {
  const Icon = useMemo(() => {
    switch (icon) {
      case 'arrowback':
        return ArrowBackIcon;
      case 'close':
        return Close;
      default:
        return ArrowBackIcon;
    }
  }, [icon]);

  return (
    <IconButton
      color={color}
      component={RouterLink}
      onClick={onClick}
      state={state}
      to={to}
    >
      <Icon />
    </IconButton>
  );
}

RouterLinkIconButton.propTypes = {
  color: PropTypes.string,
  onClick: PropTypes.func,
  state: PropTypes.shape({}),
  to: types.to.isRequired,
  icon: PropTypes.string,
};

RouterLinkIconButton.defaultProps = {
  color: 'default',
  onClick: () => {},
  state: {},
  icon: 'arrowback',
};

export default RouterLinkIconButton;
