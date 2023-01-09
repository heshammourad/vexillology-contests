import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import RedditIcon from '@material-ui/icons/Reddit';
import clsx from 'clsx';
import differenceInDays from 'date-fns/differenceInDays';
import isFuture from 'date-fns/isFuture';
import throttle from 'lodash/throttle';
import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import {
  useScrollState, useSettingsState, useSwrData, useComponentsState,
} from '../../common';
import {
  AccountMenu,
  ArrowBackButton,
  Average,
  CustomIconButton,
  FiveStar,
  HtmlWrapper,
  ListItemButton,
  PageWithDrawer,
  RedditUserAttribution,
  VotingComponents,
  VotingCountdown,
  VotingSlider,
} from '../../components';

import DrawerSectionHeader from './DrawerSectionHeader';
import NavigateIconButton from './NavigateIconButton';

const calculateImageContainerHeight = (offset) => `calc(100vh - ${offset}px)`;

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.common.black,
  },
  appBar: {
    backgroundColor: 'inherit',
  },
  average: {
    flexGrow: 1,
    fontWeight: 'bold',
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
  myRating: {
    display: 'flex',
    fontStyle: 'italic',
    textAlign: 'end',
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
  rank: {
    flexShrink: 0,
    fontWeight: 'bold',
    paddingRight: 8,
  },
  votingContainer: {
    marginTop: 16,
  },
}));

function Entry() {
  const { contestId, entryId } = useParams();
  const {
    entries = [],
    requestId,
    validRedditId,
    voteEnd,
    winners = [],
  } = useSwrData(`/contests/${contestId}`) || {};

  const { state = {} } = useLocation();
  const navigate = useNavigate();
  const classes = useStyles();

  const [{ votingDisabled }, setComponentsState] = useComponentsState();

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
    setComponentsState();

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
  const voteEndDate = new Date(voteEnd);
  const isWinner = winners.some(({ id }) => id === entry.id);

  return (
    <>
      <PageWithDrawer
        handleClose={handleDrawerClose}
        isOpen={isInfoOpenRef.current}
        className={classes.root}
        appBar={{
          position: 'fixed',
          className: classes.appBar,
          right: entry.id && (
            <>
              {validRedditId && (
                <CustomIconButton
                  innerRef={redditCommentButtonRef}
                  href={redditPermalink}
                  ariaLabel="Open Reddit comment"
                  Icon={RedditIcon}
                />
              )}
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
              <AccountMenu />
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
              <Box display="flex">
                <>
                  {isWinner && (
                  <div className={classes.rank}>
                    #
                    {entry.rank}
                  </div>
                  )}
                  <Box>
                    <div className={classes.entryName}>{entry.name}</div>
                    {isWinner && (
                      <Typography variant="caption">
                        <RedditUserAttribution user={entry.user} />
                      </Typography>
                    )}
                  </Box>
                </>
              </Box>
              {voteEnd
                && entry.imgurId
                && (isFuture(voteEndDate) ? (
                  <>
                    <DrawerSectionHeader>Submit Vote</DrawerSectionHeader>
                    {!differenceInDays(voteEndDate, new Date()) && (
                      <VotingCountdown fontSize="small" voteEndDate={voteEndDate} />
                    )}
                    <Box className={classes.votingContainer} alignItems="center" display="flex">
                      <VotingSlider
                        disabled={votingDisabled}
                        entryId={entry.imgurId}
                        rating={entry.rating}
                        setComponentsState={setComponentsState}
                      />
                    </Box>
                  </>
                ) : (
                  <Box display="flex" alignItems="baseline" paddingTop={1}>
                    <Average average={entry.average} className={classes.average} />
                    {entry.rating > -1 && (
                      <Typography className={classes.myRating} variant="caption">
                        My rating:&nbsp;
                        <FiveStar rating={entry.rating} />
                      </Typography>
                    )}
                  </Box>
                ))}
              <DrawerSectionHeader>Description</DrawerSectionHeader>
              <HtmlWrapper html={entry.description} />
              <DrawerSectionHeader>Links</DrawerSectionHeader>
              <List>
                {validRedditId && (
                  <ListItemButton
                    href={redditPermalink}
                    Icon={RedditIcon}
                    text="Open Reddit comment"
                  />
                )}
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
      <VotingComponents />
    </>
  );
}

export default Entry;
