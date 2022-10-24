import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

import types from '../common/types';

import AppBarDivided from './AppBarDivided';
import ArrowBackButton from './ArrowBackButton';

function Header({ children, position, to }) {
  return (
    <AppBarDivided color="default" disableGutters position={position}>
      <Toolbar>
        <ArrowBackButton to={to} />
        <Typography variant="h6">{children}</Typography>
      </Toolbar>
    </AppBarDivided>
  );
}

Header.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.string.isRequired,
  to: types.to.isRequired,
};

export default Header;
