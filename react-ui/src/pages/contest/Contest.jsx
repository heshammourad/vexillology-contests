/**
 * Voting and winners
 */

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { useState, useEffect, useCallback } from 'react';
import { forceCheck } from 'react-lazyload';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { animateScroll } from 'react-scroll';

import {
  useCache,
  useScrollState,
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

const scrollInstantlyTo = (scrollY) => {
  animateScroll.scrollTo(scrollY, { duration: 0, delay: 0 });
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

let scrollingIntervalId;

function Contest() {
  const navigate = useNavigate();
  const { contestId } = useParams();
  const [scroll, setScroll] = useScrollState();
  const classes = useStyles();

  const apiPath = `/contests/${contestId}`;
  const { data: contest, isValidating, mutate } = useSwrData(apiPath, false);
  const updateCache = useCache(apiPath)[1];

  if (contest?.submissionWindowOpen) {
    navigate('/submission', { replace: true });
  }

  const { state = {} } = useLocation();
  const [isLoaded, setLoaded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(state?.selectedCategories ?? []);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [experimentId, setExperimentId] = useState(null);
  const [votingExpired, setVotingExpired] = useState(false);

  // Check for elements in viewport when isLoaded changes
  useEffect(() => {
    forceCheck();
  }, [isLoaded]);

  // Manage position (scroll) and isLoaded
  useEffect(() => {
    if (!contest.name) {
      return;
    }

    if (contest.votingWindowOpen === false) {
      updateCache(null);
      setLoaded(true);
      return;
    }

    const { entryId, y } = scroll;
    const { innerWidth, requestId, scrollY } = state || {};
    if (!entryId && !scrollY) {
      setLoaded(true);
      return;
    }

    if (!isLoaded && !scrollingIntervalId) {
      scrollingIntervalId = setInterval(() => {
        if (scrollY) {
          if (window.innerWidth === innerWidth) {
            scrollInstantlyTo(scrollY);
          }
        } else {
          const entryEl = document.getElementById(entryId);
          if (!entryEl) {
            return;
          }

          let scrollTop = y;

          const headerHeight = document.getElementsByTagName('header')[0].offsetHeight;
          const { bottom, top } = entryEl.getBoundingClientRect();
          const windowTop = scrollTop + headerHeight;
          const windowBottom = scrollTop + window.innerHeight;
          if (
            scrollTop === undefined
            || (bottom < windowTop && top < windowTop)
            || (bottom > windowBottom && top > windowBottom)
            || requestId !== contest.requestId
          ) {
            scrollTop = top - headerHeight - 8;
          }

          scrollInstantlyTo(scrollTop);
        }
        setLoaded(true);
        setScroll({});
        window.history.replaceState({}, document.title);
        window.history.pushState({ usr: { selectedCategories } }, document.title);
        clearInterval(scrollingIntervalId);
        scrollingIntervalId = null;
      }, 50);
    }
  }, [state, contest]);

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
    setLoaded(false);
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

  const { headingVariant } = useContestSizing();

  const {
    categories,
    entries,
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
        <PageContainer className={clsx({ [classes.entriesLoading]: !isLoaded })} fixed>
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
          {entries && (
            <ContestGrid
              {...{
                selectedCategories,
                setExperimentDrawer,
                votingExpired,
              }}
            />
          )}
        </PageContainer>
      )}
      <RedditLogInDialog />
    </PageWithDrawer>
  );
}

export default Contest;
