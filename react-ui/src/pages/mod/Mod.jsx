import { makeStyles } from '@material-ui/core/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import { Outlet, useLocation } from 'react-router-dom';

/* eslint-disable no-restricted-imports */
import Header from '../../components/Header';
import ModeratorMenu from '../../components/ModeratorMenu';
/* eslint-enable no-restricted-imports */

const DRAWER_WIDTH = 240;

const useStyles = makeStyles((theme) => ({
  header: {
    zIndex: theme.zIndex.drawer + 1,
  },
}));

/**
 * Mod component renders the moderator page layout with a header, drawer, and main content area.
 *
 * @component
 * @returns {JSX.Element} The rendered component.
 */
function Mod() {
  const { state } = useLocation();

  const classes = useStyles();
  return (
    <Box sx={{ display: 'flex' }}>
      <Header
        appBarClassName={classes.header}
        position="fixed"
        to={state?.back ?? '/home'}
      >
        Moderator
      </Header>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          flexShrink: 0,
          width: DRAWER_WIDTH,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <ModeratorMenu highlightSelected />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Mod;
