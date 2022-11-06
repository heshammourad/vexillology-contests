import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Toolbar from '@material-ui/core/Toolbar';

import { defaultProps, objects } from '../common/types';

import ElevationScroll from './ElevationScroll';

function AppBarDivided({
  children,
  className,
  color,
  disableGutters,
  isElevationScroll,
  position,
  right,
}) {
  const appBar = (
    <AppBar className={className} color={color} position={position}>
      <Toolbar disableGutters={disableGutters}>
        <Box display="flex" flexGrow={1}>
          {children}
        </Box>
        {right}
      </Toolbar>
    </AppBar>
  );
  if (!isElevationScroll) {
    return appBar;
  }
  return <ElevationScroll>{appBar}</ElevationScroll>;
}

AppBarDivided.propTypes = objects.AppBar;
AppBarDivided.defaultProps = defaultProps.AppBar;

export default AppBarDivided;
