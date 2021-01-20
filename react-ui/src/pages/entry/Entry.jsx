import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CloseIcon from '@material-ui/icons/Close';
import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import clsx from 'clsx';
import { useState } from 'react';
import {
  Link as RouterLink, useHistory, useLocation, useParams,
} from 'react-router-dom';

import { useSwrData } from '../../common';

import './Entry.css';

const drawerWidth = 360;

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#000',
    display: 'flex',
  },
  appBar: {
    backgroundColor: 'inherit',
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
  title: {
    flexGrow: 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  drawerHeading: {
    fontSize: '18px',
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
}));

export default function PersistentDrawerRight() {
  const { contestId, entryId } = useParams();
  const { entries = [] } = useSwrData(`/contests/${contestId}`) || {};
  const entry = entries.find(({ id }) => id === entryId);

  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const history = useHistory();
  const { state = {} } = useLocation();
  const backProps = {};
  if (state.isFromContest) {
    backProps.onClick = () => history.goBack();
  } else {
    backProps.component = RouterLink;
    backProps.to = `/contests/${contestId}`;
  }

  return (
    <div className={`entry ${classes.root}`}>
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}
      >
        <Toolbar>
          <Box display="flex" flexGrow={1}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <IconButton color="inherit" {...backProps}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
          {entry && (
            <>
              <IconButton
                color="inherit"
                href={`https://www.reddit.com${entry.permalink}`}
                target="vexilollogy-contests-reddit"
              >
                <FlagTwoToneIcon />
              </IconButton>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={handleDrawerToggle}
              >
                <InfoOutlinedIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
      <main
        className={clsx(classes.content, {
          [classes.contentShift]: open,
        })}
      >
        <div className={classes.drawerHeader} />
        <Box className="flag" display="flex" alignItems="center" justifyContent="center">
          {entry && <img className="flag-img" src={entry.imgurLink} alt="" />}
        </Box>
      </main>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="right"
        open={open}
        classes={{
          paper: `drawer ${classes.drawerPaper}`,
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
            <CloseIcon />
          </IconButton>
          <div className={classes.drawerHeading}>Info</div>
        </div>
      </Drawer>
    </div>
  );
}
