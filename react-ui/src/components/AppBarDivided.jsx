import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Toolbar from '@material-ui/core/Toolbar';

import { defaultProps, objects } from '../common/types';

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

AppBarDivided.propTypes = objects.AppBar;
AppBarDivided.defaultProps = defaultProps.AppBar;

export default AppBarDivided;
