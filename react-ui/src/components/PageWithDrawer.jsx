import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import types from '../common/types';

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
  appBar, children, className, drawer, handleClose, isOpen,
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
            <CloseIcon />
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
};

PageWithDrawer.defaultProps = {
  children: null,
  className: null,
};

export default PageWithDrawer;
