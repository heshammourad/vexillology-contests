/* eslint-disable react/no-danger */
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import { makeStyles } from '@material-ui/core/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import RedditIcon from '@material-ui/icons/Reddit';
import { useContext } from 'react';
import {
  Link as RouterLink, useHistory, useLocation, useParams,
} from 'react-router-dom';

import { DrawerStateContext, useSwrData } from '../../common';
import { AppBarIconButton, ListItemButton, PageWithDrawer } from '../../components';

const calculateImageContainerHeight = (offset) => `calc(100vh - ${offset}px)`;

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#000',
  },
  imageContainer: {
    height: calculateImageContainerHeight(56),
    [theme.breakpoints.up('sm')]: {
      height: calculateImageContainerHeight(64),
    },
  },
  image: {
    maxHeight: '100%',
    maxWidth: '100%',
  },
  drawerContent: {
    fontSize: '16px',
    padding: '20px 24px',
    wordBreak: 'break-word',
  },
  entryName: {
    fontWeight: 'bold',
  },
  sectionHeader: {
    color: '#5f6368',
    fontSize: '.6875rem',
    fontWeight: 500,
    letterSpacing: '.07272727em',
    lineHeight: '1rem',
    padding: '14px 0',
    textTransform: 'uppercase',
  },
}));

export default function PersistentDrawerRight() {
  const { contestId, entryId } = useParams();
  const { entries = [] } = useSwrData(`/contests/${contestId}`) || {};
  const entry = entries.find(({ id }) => id === entryId) || {};

  const classes = useStyles();

  const { isOpen, setOpen } = useContext(DrawerStateContext);

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleDrawerToggle = () => {
    setOpen(!isOpen);
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

  const redditPermalink = `https://www.reddit.com${entry.permalink}`;
  const flagWaverLink = `https://krikienoid.github.io/flagwaver/#?src=${entry.imgurLink}`;

  return (
    <PageWithDrawer
      handleClose={handleDrawerClose}
      isOpen={isOpen}
      className={classes.root}
      appBar={{
        position: 'fixed',
        right: entry.id && (
          <>
            <AppBarIconButton
              href={redditPermalink}
              ariaLabel="Open Reddit comment"
              Icon={RedditIcon}
            />
            <AppBarIconButton
              href={flagWaverLink}
              ariaLabel="Open FlagWaver"
              Icon={FlagTwoToneIcon}
            />
            <AppBarIconButton
              ariaLabel="Open info"
              onClick={handleDrawerToggle}
              Icon={InfoOutlinedIcon}
            />
          </>
        ),
        children: (
          <>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <IconButton color="inherit" {...backProps}>
              <ArrowBackIcon />
            </IconButton>
          </>
        ),
      }}
      drawer={{
        heading: 'Info',
        children: (
          <div className={classes.drawerContent}>
            <div className={classes.entryName}>{entry.name}</div>
            <div dangerouslySetInnerHTML={{ __html: entry.description }} />
            <div className={classes.sectionHeader}>Links</div>
            <List>
              <ListItemButton href={redditPermalink} Icon={RedditIcon} text="Open Reddit comment" />
              <ListItemButton href={flagWaverLink} Icon={FlagTwoToneIcon} text="Open FlagWaver" />
            </List>
          </div>
        ),
      }}
    >
      <Box
        className={classes.imageContainer}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {entry && <img className={classes.image} src={entry.imgurLink} alt="" />}
      </Box>
    </PageWithDrawer>
  );
}
