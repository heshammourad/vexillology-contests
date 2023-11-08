/**
 * Wrapper to add sliding drawer
 * @param appBar Header
 * @param children Content to display as main page
 * @param className
 * @param drawer Content to display within drawer
 * @param handleClose
 * @param isOpen
 */

import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import types from '../common/types';
import { IS_DEV_BAR } from '../env';

import AppBarDivided from './AppBarDivided';

const drawerWidth = 360;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  },
  content: {
    flexGrow: 1,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginRight: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
    },
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  drawerHeading: {
    fontSize: '18px',
  },
}));

function PageWithDrawer({
  appBar, children, className, drawer, handleClose, isOpen, isModal,
}) {
  const classes = useStyles();
  return (
    <div className={clsx(classes.root, className)}>
      <AppBarDivided
        accountMenuColor={appBar.accountMenuColor}
        className={clsx(classes.appBar, appBar.className, {
          [classes.appBarShift]: isOpen,
        })}
        color={appBar.color}
        isElevationScroll={appBar.isElevationScroll}
        position={appBar.position}
        right={appBar.right}
      >
        {appBar.children}
      </AppBarDivided>
      <main
        className={clsx(classes.content, {
          [classes.contentShift]: isOpen,
        })}
      >
        {IS_DEV_BAR && !isModal && <Toolbar variant="dense" />}
        <Toolbar />
        {children}
      </main>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="right"
        open={isOpen}
        classes={{ paper: classes.drawerPaper }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleClose}>
            <ChevronRightIcon />
          </IconButton>
          <div className={classes.drawerHeading}>{drawer.heading}</div>
        </div>
        {drawer.children}
      </Drawer>
    </div>
  );
}

PageWithDrawer.propTypes = {
  appBar: types.AppBar.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  drawer: PropTypes.shape({
    children: PropTypes.node,
    heading: PropTypes.string,
  }).isRequired,
  handleClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  isModal: PropTypes.bool,
};

PageWithDrawer.defaultProps = {
  children: null,
  className: null,
  isModal: false,
};

export default PageWithDrawer;
