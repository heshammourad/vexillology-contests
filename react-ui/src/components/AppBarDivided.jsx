import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Toolbar from '@material-ui/core/Toolbar';

import { defaultProps, objects } from '../common/types';

import AccountMenu from './AccountMenu';
import ElevationScroll from './ElevationScroll';

function AppBarDivided({
  accountMenuColor,
  children,
  className,
  color,
  isElevationScroll,
  position,
  right,
}) {
  const appBar = (
    <AppBar className={className} color={color} position={position}>
      <Toolbar>
        <Box display="flex" alignItems="center" flexGrow={1}>
          {children}
        </Box>
        {right}
        <AccountMenu color={accountMenuColor} />
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
