import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

import AppBarDivided from './AppBarDivided';
import ArrowBackButton from './ArrowBackButton';

const Header = ({ children, to }) => (
  <AppBarDivided color="default" disableGutters position="static">
    <Toolbar>
      <ArrowBackButton to={to} />
      <Typography variant="h6">{children}</Typography>
    </Toolbar>
  </AppBarDivided>
);

Header.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string.isRequired,
};

export default Header;
