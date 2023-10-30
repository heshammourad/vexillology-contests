/**
 * App header
 * Typically called through ./Header.jsx
 * see https://mui.com/material-ui/react-app-bar/
 */

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Toolbar from '@material-ui/core/Toolbar';

import { defaultProps, objects } from '../common/types';

import AccountMenu from './AccountMenu';
import DevBar from './DevBar';
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
  const isModal = accountMenuColor === 'inherit';
  const appBar = (
    <AppBar className={className} color={color} position={position}>
      {!isModal && <DevBar />}
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
