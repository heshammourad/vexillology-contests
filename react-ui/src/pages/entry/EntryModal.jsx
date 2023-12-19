/**
 * Full page entry
 * ??? Get rid of Refs for click() events, just open link
 */

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import { makeStyles } from '@material-ui/core/styles';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import clsx from 'clsx';
import throttle from 'lodash/throttle';
import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';

import { useSettingsState, useVoting } from '../../common';
import {
  EntryDescriptionDrawer,
  PageWithDrawer,
  RedditLogInDialog,
} from '../../components';
import useEntryId from '../../data/useEntryId';
import useSwrContest from '../../data/useSwrContest';

import EntryAppBarMain from './EntryAppBarMain';
import EntryAppBarRight from './EntryAppBarRight';
import NavigateIconButton from './NavigateIconButton';

const calculateImageContainerHeight = (offset) => `calc(100vh - ${offset}px)`;

const useStyles = makeStyles((theme) => ({
  root: (props) => ({
    backgroundColor: props?.backgroundColor || theme.palette.common.black,
  }),
  appBar: (props) => ({
    backgroundColor: props?.backgroundColor || theme.palette.common.black,
    color: props?.backgroundColor === '#FFFFFF' ? theme.palette.common.black : theme.palette.common.white,
  }),
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
}));

function EntryModal() {
  /**
   * AppBar
   */
  const redditCommentButtonRef = useRef(null);
  const flagWaverButtonRef = useRef(null);

  /**
   * Info drawer
   */
  const [{ isEntryDrawerOpen }, updateSettings] = useSettingsState();
  const isEntryDrawerOpenRef = useRef(isEntryDrawerOpen);
  const updateInfoSetting = (isOpen) => {
    isEntryDrawerOpenRef.current = isOpen;
    updateSettings('isEntryDrawerOpen', isOpen);
  };
  const handleDrawerClose = () => {
    updateInfoSetting(false);
  };

  const toggleInfoDrawerOpen = () => {
    updateInfoSetting(!isEntryDrawerOpenRef.current);
  };

  /**
   * Entries
   */
  const entryId = useEntryId();
  const { data } = useSwrContest();
  const {
    entries = [],
    winners = [],
    localVoting,
  } = data;
  const allEntriesRef = useRef([]);
  const [entry, setEntry] = useState({});
  const [entryIndex, updateEntryIndex] = useState(-1);
  const entryIndexRef = useRef(entryIndex);
  const setEntryIndex = (value) => {
    entryIndexRef.current = value;
    updateEntryIndex(value);
  };

  /**
  * Layout
  */
  const classes = useStyles(entry);
  const imageContainerRef = useRef(null);

  /**
   * Navigation and voting
   */
  const { changeRating, clearRating } = useVoting(entryId, 'EntryModal');
  const navigate = useNavigate();
  const { selectedCategories = [] } = useOutletContext();
  const { state = {} } = useLocation();
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
    navigate(`../${id}`, { relative: 'path', replace: true, state });
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
      case 'c':
        clearRating();
        return;
      default:
        if (key >= '0' && key <= '5') {
          changeRating(parseInt(key, 10), entry?.rating, /* isKeyed= */ true);
        }
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
  }, [handleKeyUp]);

  useEffect(() => {
    const allEntries = [...winners, ...entries].filter(
      ({ category }) => !selectedCategories?.length
        || selectedCategories?.includes(category),
    );
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

  return (
    <>
      <Dialog
        open
        fullScreen
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        transitionDuration={0}
      >
        <PageWithDrawer
          handleClose={handleDrawerClose}
          isOpen={isEntryDrawerOpen}
          isModal
          className={classes.root}
          appBar={{
            position: 'fixed',
            accountMenuColor: 'inherit',
            className: classes.appBar,
            right: (entry?.id && (
              <EntryAppBarRight
                {...{
                  redditCommentButtonRef,
                  flagWaverButtonRef,
                  toggleInfoDrawerOpen,
                  localVoting,
                  entry,
                }}
              />
            )),
            children: <EntryAppBarMain />,
          }}
          drawer={{ heading: 'Info', children: <EntryDescriptionDrawer {...{ entryId }} /> }}
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
            {entry?.imagePath && <img className={classes.image} src={entry.imagePath} alt="" />}
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
      </Dialog>
      <RedditLogInDialog />
    </>
  );
}

export default EntryModal;
