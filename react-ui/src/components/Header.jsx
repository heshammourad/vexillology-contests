import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

import AppBarDivided from './AppBarDivided';
import ArrowBackButton from './ArrowBackButton';

const Header = ({
  children, className, position, to,
}) => (
  <AppBarDivided className={className} color="default" disableGutters position={position}>
    <Toolbar>
      <ArrowBackButton to={to} />
      <Typography variant="h6">{children}</Typography>
    </Toolbar>
  </AppBarDivided>
);

Header.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  position: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
};

Header.defaultProps = {
  className: '',
};

export default Header;
