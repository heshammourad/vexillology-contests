/**
 * Voting and winners
 */

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { useState, useEffect, useCallback } from 'react';
import { forceCheck } from 'react-lazyload';
import {
  Outlet, useLocation, useNavigate, useParams,
} from 'react-router-dom';
import { animateScroll } from 'react-scroll';

import {
  useCache,
  useSwrData,
} from '../../common';
import {
  EntryDescriptionDrawer,
  HtmlWrapper,
  PageContainer,
  PageWithDrawer,
  RedditLogInDialog,
} from '../../components';

import ContestAppBarMain from './ContestAppBarMain';
import ContestAppBarRight from './ContestAppBarRight';
import ContestCategorySelector from './ContestCategorySelector';
import ContestGrid from './ContestGrid';
import ContestSettings from './ContestSettings';
import ContestSponsor from './ContestSponsor';
import ContestUnderReview from './ContestUnderReview';
import ContestWinners from './ContestWinners';
import useContestSizing from './useContestSizing';

const scrollInstantlyTo = (scrollY, options = {}) => {
  const defaultOptions = { duration: 0, delay: 0 };
  animateScroll.scrollTo(scrollY, { ...defaultOptions, ...options });
};

const useStyles = makeStyles((theme) => ({
  entriesLoading: {
    visibility: 'hidden',
  },
  heading: {
    margin: '24px auto',
  },
  icon: {
    color: theme.palette.grey[700],
  },
}));

function Contest() {
  const navigate = useNavigate();
  const { contestId } = useParams();
  const classes = useStyles();

  const apiPath = `/contests/${contestId}`;
  const { data: contest, isValidating, mutate } = useSwrData(apiPath, false);
  const updateCache = useCache(apiPath)[1];

  if (contest?.submissionWindowOpen) {
    navigate('/submission', { replace: true });
  }

  const location = useLocation();
  const { state = {} } = location;

  const [selectedCategories, setSelectedCategories] = useState(state?.selectedCategories ?? []);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [experimentId, setExperimentId] = useState(null);
  const [votingExpired, setVotingExpired] = useState(false);

  // Scroll to top when unmounted
  // For site-wide solution see https://reactrouter.com/en/main/components/scroll-restoration
  useEffect(() => () => {
    scrollInstantlyTo(0);
  }, []);

  // Check for elements in viewport when isLoaded changes
  useEffect(() => {
    forceCheck();
  }, [contest.name]);


  useEffect(() => {
    // Clear cache if the voting window is still closed to force fetch again on next visit
    if (contest.votingWindowOpen === false) {
      updateCache(null);
    }
  }, [contest.votingWindowOpen]);

  // ??? WHAT ELSE CAN BE REMOVED HERE?
  // useEffect(() => {
  // instead of isLoaded, I think we can just use contest.name
  // if (!contest.name) {
  //   return;
  // }

  // Does replaceState and pushState matter?
  // const { entryId } = scroll;
  // const { scrollY } = state || {};
  // if (!entryId && !scrollY) {
  //   return;
  // }

  // if (!isLoaded) {
  //   window.history.replaceState({}, document.title);
  //   window.history.pushState({ usr: { selectedCategories } }, document.title);
  // }
  // }, [state, contest]);

  // forceCheck elements in viewport when selectedCategories changes
  useEffect(() => {
    forceCheck();
    window.history.pushState(
      { usr: { ...window.history.state?.usr, selectedCategories } },
      document.title,
    );
  }, [selectedCategories]);

  const handleVotingExpired = useCallback(() => {
    updateCache(null);
    setVotingExpired(true);
  }, []);

  const handleReload = useCallback(() => {
    scrollInstantlyTo(0);
    window.location.reload();
  }, []);

  const toggleDrawerOpen = useCallback((isOpen) => {
    setExperimentId(null);
    setIsDrawerOpen(isOpen);
  }, []);

  const closeDrawer = useCallback(() => {
    toggleDrawerOpen(false);
  }, []);

  const setExperimentDrawer = useCallback((entryId) => {
    setExperimentId(entryId);
    setIsDrawerOpen(!!entryId);
  }, []);

  const scrollToEntry = useCallback((entryId) => {
    const entryEl = document.getElementById(entryId);
    if (!entryEl) {
      return;
    }

    const currentScroll = window.scrollY;

    const headerHeight = document.getElementsByTagName('header')[0].offsetHeight;
    const {
      bottom: entryBottom,
      top: entryTop,
      height: entryHeight,
    } = entryEl.getBoundingClientRect();
    const windowTop = headerHeight + 8;
    const windowBottom = window.innerHeight - 8;

    if (entryTop < windowTop) {
      scrollInstantlyTo(entryTop + currentScroll - windowTop);
      return;
    }

    const visibleWindow = windowBottom - windowTop;
    if (entryBottom > windowBottom) {
      if (visibleWindow > entryHeight) {
        // scroll to bottom, for when scrolling downwards
        scrollInstantlyTo(entryBottom + currentScroll - windowBottom);
      } else {
        // scroll to top
        scrollInstantlyTo(entryTop + currentScroll - windowTop);
      }
    }
  }, []);

  // scroll to stored scrollY position when login completed (see useRedditLogIn)
  // ??? This code underscrolls when position is at the bottom of the flags (end of page)
  useEffect(() => {
    if (!contest.name) {
      return;
    }
    const { scrollY, innerWidth } = state || {};
    if (scrollY && window.innerWidth === innerWidth) {
      scrollInstantlyTo(scrollY);
    }
  }, [state?.scrollY, contest.name]);

  const [entryId, setEntryId] = useState(null);
  // scroll to entry when closing modal (direct link or arrow keying)
  // see EntryAppBarMain
  useEffect(() => {
    if (entryId) {
      scrollToEntry(entryId);
      setEntryId(null);
    }
  }, [entryId]);

  const { headingVariant } = useContestSizing();

  const {
    categories,
    isContestMode,
    name,
    subtext,
    votingWindowOpen,
    winners,
  } = contest;

  return (
    <PageWithDrawer
      handleClose={closeDrawer}
      isOpen={isDrawerOpen}
      appBar={{
        className: classes.icon,
        color: 'default',
        right: <ContestAppBarRight {...{ toggleDrawerOpen }} />,
        children: <ContestAppBarMain {...{ handleVotingExpired, handleReload }} />,
      }}
      drawer={experimentId ? { heading: 'Info', children: <EntryDescriptionDrawer entryId={experimentId} /> } : { heading: 'Settings', children: <ContestSettings /> }}
    >
      <ContestSponsor />
      {name && (
        <PageContainer className={clsx({ [classes.entriesLoading]: !contest.name })} fixed>
          <Typography className={classes.heading} variant={headingVariant} component="h1">
            {name}
          </Typography>
          {votingWindowOpen === false && <ContestUnderReview {...{ isValidating, mutate }} />}
          {isContestMode && subtext && (
            <Box marginBottom={3}>
              <Typography component="div" variant="subtitle1">
                <HtmlWrapper html={subtext} />
              </Typography>
            </Box>
          )}
          <ContestCategorySelector {...{ categories, selectedCategories, setSelectedCategories }} />
          <ContestWinners {...{ winners }} />
          <ContestGrid
            {...{
              selectedCategories,
              setExperimentDrawer,
              votingExpired,
            }}
          />
        </PageContainer>
      )}
      <RedditLogInDialog />
      <Outlet context={{ selectedCategories, setEntryId }} />
    </PageWithDrawer>
  );
}

export default Contest;
