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

  const allEntriesRef = useRef([]);
  const [entryIndex, updateEntryIndex] = useState(-1);
  const entryIndexRef = useRef(entryIndex);
  const setEntryIndex = (value) => {
    entryIndexRef.current = value;
    updateEntryIndex(value);
  };
  const [entry, setEntry] = useState({});

  const [shouldShowNavigation, updateShouldShowNavigation] = useState({
    before: false,
    next: false,
  });
  const shouldShowNavigationRef = useRef(shouldShowNavigation);
  const setShouldShowNavigation = (value) => {
    shouldShowNavigationRef.current = value;
    updateShouldShowNavigation(value);
  };
  const [navigationSide, setNavigationSide] = useState('');

  const imageContainerRef = useRef(null);

  const handleNavigate = (indexChange) => {
    if (
      !indexChange
      || (indexChange < 0 && !shouldShowNavigationRef.current.before)
      || (indexChange > 0 && !shouldShowNavigationRef.current.next)
    ) {
      setNavigationSide('');
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
      default:
        return;
    }
    handleNavigate(indexChange);
  };

  useEffect(() => {
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
    setShouldShowNavigation({
      before: newEntryIndex > 0,
      next: newEntryIndex >= 0 && newEntryIndex < allEntries.length - 1,
    });
    setEntry(newEntryIndex > -1 ? allEntries[newEntryIndex] : {});
  }, [entries, entryId]);

  const updateInfoSetting = (infoOpen) => {
    updateSettings('isInfoOpen', infoOpen);
  };

  const handleDrawerClose = () => {
    updateInfoSetting(false);
  };

  const handleDrawerToggle = () => {
    updateInfoSetting(!isInfoOpen);
  };

  const handleMouseUp = ({ button, target }) => {
    if (
      entryIndex < 0
      || button !== 0
      || target.matches(`.${classes.navigateButton},.${classes.navigateButton} *`)
    ) {
      return;
    }

    let indexChange;
    switch (navigationSide) {
      case 'before':
        indexChange = -1;
        break;
      case 'next':
        indexChange = 1;
        break;
      default:
        return;
    }

    handleNavigate(indexChange);
  };

  const handleMouseMove = ({ clientX }) => {
    if (!imageContainerRef.current) {
      return;
    }

    const ratio = (clientX * 1.0) / imageContainerRef.current.offsetWidth;
    let newNavigationSide = '';
    if (shouldShowNavigation.before && ratio <= 1 / 3) {
      newNavigationSide = 'before';
    } else if (shouldShowNavigation.next && ratio >= 2 / 3) {
      newNavigationSide = 'next';
    }
    setNavigationSide(newNavigationSide);
  };

  const handleMouseMoveThrottled = useMemo(
    () => throttle(handleMouseMove, 100),
    [imageContainerRef, navigationSide, shouldShowNavigation],
  );

  const touchTimeoutId = useRef(null);
  const handleTouchEnd = () => {
    if (touchTimeoutId.current) {
      clearTimeout(touchTimeoutId.current);
    }

    touchTimeoutId.current = setTimeout(() => {
      setNavigationSide('');
    }, 5000);
  };

  if (!entry) {
    return null;
  }

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
        ref={imageContainerRef}
        className={clsx(classes.imageContainer, { [classes.clickActive]: !!navigationSide })}
        display="flex"
        alignItems="center"
        justifyContent="center"
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMoveThrottled}
        onTouchEnd={handleTouchEnd}
      >
        {shouldShowNavigation.before && (
          <NavigateIconButton
            className={clsx(classes.navigateButton, classes.navigateBefore, {
              [classes.navigateVisible]: navigationSide === 'before',
            })}
            Icon={NavigateBeforeIcon}
            onClick={() => {
              handleNavigate(-1);
            }}
          />
        )}
        {entry.imgurLink && <img className={classes.image} src={entry.imgurLink} alt="" />}
        {shouldShowNavigation.next && (
          <NavigateIconButton
            className={clsx(classes.navigateButton, classes.navigateNext, {
              [classes.navigateVisible]: navigationSide === 'next',
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
