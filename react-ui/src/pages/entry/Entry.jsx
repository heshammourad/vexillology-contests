import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import { makeStyles } from '@material-ui/core/styles';
import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import RedditIcon from '@material-ui/icons/Reddit';
import clsx from 'clsx';
import throttle from 'lodash/throttle';
import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

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
  clickActive: {
    cursor: 'pointer',
  },
  imageContainer: {
    height: calculateImageContainerHeight(56),
    position: 'relative',
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
  navigateButton: {
    opacity: 0,
    '&:focus': {
      opacity: 1,
    },
  },
  navigateNext: {
    right: 28,
  },
  navigateVisible: {
    opacity: 1,
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

  const { state = {} } = useLocation();
  const navigate = useNavigate();
  const classes = useStyles();

  const [scroll, setScroll] = useScrollState();
  const [{ isInfoOpen }, updateSettings] = useSettingsState();
  const isInfoOpenRef = useRef(isInfoOpen);
  const updateInfoSetting = (infoOpen) => {
    isInfoOpenRef.current = infoOpen;
    updateSettings('isInfoOpen', infoOpen);
  };

  const allEntriesRef = useRef([]);
  const [entryIndex, updateEntryIndex] = useState(-1);
  const entryIndexRef = useRef(entryIndex);
  const setEntryIndex = (value) => {
    entryIndexRef.current = value;
    updateEntryIndex(value);
  };
  const [entry, setEntry] = useState({});

  const [isNavigationAvailable, updateNavigationAvailable] = useState({
    before: false,
    next: false,
  });
  const isNavigationAvailableRef = useRef(isNavigationAvailable);
  const setNavigationAvailable = (value) => {
    isNavigationAvailableRef.current = value;
    updateNavigationAvailable(value);
  };
  const [isNavigationVisible, setNavigationVisible] = useState({ before: true, next: true });
  const hideNavigation = () => {
    setNavigationVisible({ before: false, next: false });
  };

  const redditCommentButtonRef = useRef(null);
  const flagWaverButtonRef = useRef(null);
  const imageContainerRef = useRef(null);

  const handleDrawerClose = () => {
    updateInfoSetting(false);
  };

  const toggleInfoDrawerOpen = () => {
    updateInfoSetting(!isInfoOpenRef.current);
  };

  const handleNavigate = (indexChange) => {
    if (
      !indexChange
      || (indexChange < 0 && !isNavigationAvailableRef.current.before)
      || (indexChange > 0 && !isNavigationAvailableRef.current.next)
    ) {
      hideNavigation();
      return;
    }

    setEntry({});

    const { id } = allEntriesRef.current[entryIndexRef.current + indexChange];
    navigate(`../${id}`, { relative: 'path', replace: true });
  };

  const handleKeyUp = ({ key }) => {
    let indexChange = 0;
    switch (key) {
      case 'ArrowLeft':
        indexChange = -1;
        break;
      case 'ArrowRight':
        indexChange = 1;
        break;
      case 'f':
        flagWaverButtonRef.current.click();
        return;
      case 'i':
        toggleInfoDrawerOpen();
        return;
      case 'r':
        redditCommentButtonRef.current.click();
        return;
      default:
        return;
    }
    handleNavigate(indexChange);
  };

  const navigationVisibleTimeoutRef = useRef(null);
  useEffect(() => {
    navigationVisibleTimeoutRef.current = setTimeout(() => {
      hideNavigation();
    }, 3000);

    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const allEntries = [...winners, ...entries];
    if (!entryId || !allEntries.length) {
      return;
    }
    allEntriesRef.current = allEntries;

    const newEntryIndex = allEntries.findIndex(({ id }) => id === entryId);

    setEntryIndex(newEntryIndex);
    setNavigationAvailable({
      before: newEntryIndex > 0,
      next: newEntryIndex >= 0 && newEntryIndex < allEntries.length - 1,
    });
    setEntry(newEntryIndex > -1 ? allEntries[newEntryIndex] : {});
  }, [entries, entryId]);

  const touchTimeoutId = useRef(null);
  const clearTouchTimeout = () => {
    if (touchTimeoutId.current) {
      clearTimeout(touchTimeoutId.current);
    }
  };

  const handleTouchEnd = () => {
    clearTouchTimeout();

    touchTimeoutId.current = setTimeout(() => {
      hideNavigation();
    }, 5000);
  };

  const updateMouseMove = (clientX) => {
    if (navigationVisibleTimeoutRef.current) {
      clearTimeout(navigationVisibleTimeoutRef.current);
    }

    const ratio = (clientX * 1.0) / imageContainerRef.current.offsetWidth;
    const newNavigationSide = { before: false, next: false };
    if (isNavigationAvailable.before && ratio <= 1 / 3) {
      newNavigationSide.before = true;
    } else if (isNavigationAvailable.next && ratio >= 2 / 3) {
      newNavigationSide.next = true;
    }
    setNavigationVisible(newNavigationSide);
    return newNavigationSide;
  };

  const handleMouseMove = ({ clientX }) => {
    if (!imageContainerRef.current) {
      return;
    }

    updateMouseMove(clientX);
  };

  const handleMouseMoveThrottled = useMemo(
    () => throttle(handleMouseMove, 100),
    [imageContainerRef, isNavigationVisible, isNavigationAvailable],
  );

  const handleMouseUp = ({ button, clientX, target }) => {
    if (
      entryIndex < 0
      || button !== 0
      || target.matches(`.${classes.navigateButton},.${classes.navigateButton} *`)
    ) {
      return;
    }

    const newNavigationSide = updateMouseMove(clientX);

    let indexChange;
    if (newNavigationSide.before) {
      indexChange = -1;
    } else if (newNavigationSide.next) {
      indexChange = 1;
    }

    handleNavigate(indexChange);
  };

  if (!entry) {
    return null;
  }

  const redditPermalink = `https://www.reddit.com${entry.permalink}`;
  const flagWaverLink = `https://krikienoid.github.io/flagwaver/#?src=${entry.imgurLink}`;

  return (
    <PageWithDrawer
      handleClose={handleDrawerClose}
      isOpen={isInfoOpenRef.current}
      className={classes.root}
      appBar={{
        position: 'fixed',
        className: classes.appBar,
        right: entry.id && (
          <>
            <CustomIconButton
              innerRef={redditCommentButtonRef}
              href={redditPermalink}
              ariaLabel="Open Reddit comment"
              Icon={RedditIcon}
            />
            <CustomIconButton
              innerRef={flagWaverButtonRef}
              href={flagWaverLink}
              ariaLabel="Open FlagWaver"
              Icon={FlagTwoToneIcon}
            />
            <CustomIconButton
              ariaLabel="Open info"
              onClick={toggleInfoDrawerOpen}
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
        ref={imageContainerRef}
        className={clsx(classes.imageContainer, {
          [classes.clickActive]: isNavigationVisible.before || isNavigationVisible.next,
        })}
        display="flex"
        alignItems="center"
        justifyContent="center"
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMoveThrottled}
        onTouchEnd={handleTouchEnd}
      >
        {isNavigationAvailable.before && (
          <NavigateIconButton
            className={clsx(classes.navigateButton, classes.navigateBefore, {
              [classes.navigateVisible]: isNavigationVisible.before,
            })}
            Icon={NavigateBeforeIcon}
            onClick={() => {
              handleNavigate(-1);
            }}
          />
        )}
        {entry.imgurLink && <img className={classes.image} src={entry.imgurLink} alt="" />}
        {isNavigationAvailable.next && (
          <NavigateIconButton
            className={clsx(classes.navigateButton, classes.navigateNext, {
              [classes.navigateVisible]: isNavigationVisible.next,
            })}
            Icon={NavigateNextIcon}
            onClick={() => {
              handleNavigate(1);
            }}
          />
        )}
      </Box>
    </PageWithDrawer>
  );
}

export default Entry;
