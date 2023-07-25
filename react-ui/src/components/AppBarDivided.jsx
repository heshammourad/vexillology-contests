/**
 * App header
 * Typically called through ./Header.jsx
 * see https://mui.com/material-ui/react-app-bar/
 */

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

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
