import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import { makeStyles } from '@material-ui/core/styles';
import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import RedditIcon from '@material-ui/icons/Reddit';
import { useParams, useLocation } from 'react-router-dom';

import { useScrollState, useSettingsState, useSwrData } from '../../common';
import {
  ArrowBackButton,
  CustomIconButton,
  HtmlWrapper,
  ListItemButton,
  PageWithDrawer,
} from '../../components';

import NavigateIconButton from './NavigateIconButton';

const calculateImageContainerHeight = (offset) => `calc(100vh - ${offset}px)`;

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#000',
  },
  appBar: {
    backgroundColor: 'inherit',
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
  navigateBefore: {
    left: 28,
  },
  navigateNext: {
    right: 28,
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

function Entry() {
  const { contestId, entryId } = useParams();
  const { entries = [], requestId, winners = [] } = useSwrData(`/contests/${contestId}`) || {};
  const entry = [...winners, ...entries].find(({ id }) => id === entryId) || {};

  const { state = {} } = useLocation();
  const classes = useStyles();

  const [scroll, setScroll] = useScrollState();
  const [{ isInfoOpen }, updateSettings] = useSettingsState();

  const updateInfoSetting = (infoOpen) => {
    updateSettings('isInfoOpen', infoOpen);
  };

  const handleDrawerClose = () => {
    updateInfoSetting(false);
  };

  const handleDrawerToggle = () => {
    updateInfoSetting(!isInfoOpen);
  };

  const redditPermalink = `https://www.reddit.com${entry.permalink}`;
  const flagWaverLink = `https://krikienoid.github.io/flagwaver/#?src=${entry.imgurLink}`;

  return (
    <PageWithDrawer
      handleClose={handleDrawerClose}
      isOpen={isInfoOpen}
      className={classes.root}
      appBar={{
        position: 'fixed',
        className: classes.appBar,
        right: entry.id && (
          <>
            <CustomIconButton
              href={redditPermalink}
              ariaLabel="Open Reddit comment"
              Icon={RedditIcon}
            />
            <CustomIconButton
              href={flagWaverLink}
              ariaLabel="Open FlagWaver"
              Icon={FlagTwoToneIcon}
            />
            <CustomIconButton
              ariaLabel="Open info"
              onClick={handleDrawerToggle}
              Icon={InfoOutlinedIcon}
            />
          </>
        ),
        children: (
          <ArrowBackButton
            color="inherit"
            onClick={() => {
              setScroll({ ...scroll, entryId: entry.id });
            }}
            state={{ back: (state || {}).back, requestId }}
            to={`/contests/${contestId}`}
          />
        ),
      }}
      drawer={{
        heading: 'Info',
        children: (
          <div className={classes.drawerContent}>
            <div className={classes.entryName}>{entry.name}</div>
            <HtmlWrapper html={entry.description} />
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
        <NavigateIconButton className={classes.navigateBefore} Icon={NavigateBeforeIcon} />
        {entry && <img className={classes.image} src={entry.imgurLink} alt="" />}
        <NavigateIconButton className={classes.navigateNext} Icon={NavigateNextIcon} />
      </Box>
    </PageWithDrawer>
  );
}

export default Entry;
