import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Toolbar from '@material-ui/core/Toolbar';
import PropTypes from 'prop-types';

const AppBarDivided = ({
  children, className, color, position, right,
}) => (
  <AppBar className={className} color={color} position={position}>
    <Toolbar>
      <Box display="flex" flexGrow={1}>
        {children}
      </Box>
      {right}
    </Toolbar>
  </AppBar>
);

AppBarDivided.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  color: PropTypes.oneOf(['default', 'inherit', 'primary', 'secondary', 'transparent']),
  position: PropTypes.oneOf(['absolute', 'fixed', 'relative', 'static', 'sticky']),
  right: PropTypes.node,
};

AppBarDivided.defaultProps = {
  className: undefined,
  color: 'primary',
  position: 'fixed',
  right: null,
};

export default AppBarDivided;
