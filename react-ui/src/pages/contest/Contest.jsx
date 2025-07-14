/**
 * Voting and winners
 */
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ExpandMore from '@material-ui/icons/ExpandMore';
import clsx from 'clsx';
import { useState, useEffect, useCallback } from 'react';
import { forceCheck } from 'react-lazyload';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { animateScroll } from 'react-scroll';

import {
  EntryDescriptionDrawer,
  FormattedContent,
  PageContainer,
  PageWithDrawer,
  RedditLogInDialog,
} from '../../components';
import useSwrContest from '../../data/useSwrContest';

import ContestAppBarMain from './ContestAppBarMain';
import ContestAppBarRight from './ContestAppBarRight';
import ContestContent from './ContestContent';
import ContestSettings from './ContestSettings';
import ContestSponsor from './ContestSponsor';
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
  prompt: {
    backgroundColor: theme.palette.grey[200],
    marginBottom: '20px',
  },
}));

function Contest() {
  const navigate = useNavigate();
  const classes = useStyles();

  const { data: contest, isValidating, mutate } = useSwrContest();

  const location = useLocation();
  const { state = {} } = location;

  const [selectedCategories, setSelectedCategories] = useState(
    state?.selectedCategories ?? [],
  );
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerEntryId, setDrawerEntryId] = useState(null);

  if (contest?.contestStatus === 'SUBMISSIONS_OPEN' && !isValidating) {
    navigate('/submission', { replace: true });
  }

  // Scroll to top when unmounted
  // For site-wide solution see https://reactrouter.com/en/main/components/scroll-restoration
  useEffect(
    () => () => {
      scrollInstantlyTo(0);
    },
    [],
  );

  // Check for elements in viewport when isLoaded changes
  useEffect(() => {
    forceCheck();
  }, [contest.name]);

  useEffect(() => {
    // Clear cache if the voting window is still closed to force fetch again on next visit
    if (contest.contestStatus === 'SUBMISSIONS_CLOSED') {
      mutate();
    }
  }, [contest.contestStatus]);

  const handleReload = useCallback(() => {
    scrollInstantlyTo(0);
    window.location.reload();
  }, []);

  const togglePromptOpen = useCallback(() => {
    setIsPromptOpen((prev) => !prev);
  }, []);

  const toggleDrawerOpen = useCallback((isOpen) => {
    setDrawerEntryId(null);
    setIsDrawerOpen(isOpen);
  }, []);

  const closeDrawer = useCallback(() => {
    toggleDrawerOpen(false);
  }, []);

  const setDrawer = useCallback((entryId) => {
    setDrawerEntryId(entryId);
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

  const [scrollEntryId, setScrollEntryId] = useState(null);
  // scroll to entry when closing modal (direct link or arrow keying)
  // see EntryAppBarMain
  useEffect(() => {
    if (scrollEntryId) {
      scrollToEntry(scrollEntryId);
      setScrollEntryId(null);
    }
  }, [scrollEntryId]);

  const { headingVariant } = useContestSizing();

  const { name, prompt } = contest;

  // Prevents display of stale, cached data
  if (isValidating) {
    return (
      <PageWithDrawer
        isOpen={false}
        appBar={{
          className: classes.icon,
          color: 'default',
          right: <ContestAppBarRight {...{ toggleDrawerOpen, contest }} />,
        }}
        drawer={{ heading: 'Loading...', children: null }}
      >
        <PageContainer>
          <Box marginBottom={6} />
          <CircularProgress />
        </PageContainer>
        <RedditLogInDialog />
      </PageWithDrawer>
    );
  }

  return (
    <PageWithDrawer
      handleClose={closeDrawer}
      isOpen={isDrawerOpen}
      appBar={{
        className: classes.icon,
        color: 'default',
        right: <ContestAppBarRight {...{ toggleDrawerOpen, contest }} />,
        children: <ContestAppBarMain {...{ handleReload, contest }} />,
      }}
      drawer={
        drawerEntryId
          ? {
            heading: 'Info',
            children: <EntryDescriptionDrawer entryId={drawerEntryId} />,
          }
          : { heading: 'Settings', children: <ContestSettings /> }
      }
    >
      <ContestSponsor />
      {name && (
        <PageContainer
          className={clsx({ [classes.entriesLoading]: !contest.name })}
          fixed
        >
          <Typography
            className={classes.heading}
            variant={headingVariant}
            component="h1"
          >
            {name}
          </Typography>

          <Accordion
            className={classes.prompt}
            expanded={isPromptOpen}
            onChange={togglePromptOpen}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              {isPromptOpen ? 'Hide' : 'View'}
              {' '}
              contest prompt
            </AccordionSummary>
            <AccordionDetails
              onClick={togglePromptOpen}
              style={{ cursor: 'pointer' }}
            >
              <FormattedContent content={prompt} markdown />
            </AccordionDetails>
          </Accordion>
          <ContestContent
            {...{ selectedCategories, setDrawer, setSelectedCategories }}
          />
        </PageContainer>
      )}
      <RedditLogInDialog />
      <Outlet context={{ selectedCategories, setScrollEntryId }} />
    </PageWithDrawer>
  );
}

export default Contest;
