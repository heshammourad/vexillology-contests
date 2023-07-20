/**
 * Voting and winners
 */

import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import DescriptionIcon from '@material-ui/icons/Description';
import EmojiEventsOutlinedIcon from '@material-ui/icons/EmojiEventsOutlined';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import ThumbsUpDownOutlinedIcon from '@material-ui/icons/ThumbsUpDownOutlined';
import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { forceCheck } from 'react-lazyload';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { animateScroll } from 'react-scroll';

import {
  useCache,
  useClientWidth,
  useComponentsState,
  useScrollState,
  useSettingsState,
  useSwrData,
} from '../../common';
import {
  ArrowBackButton,
  Average,
  CategoryLabel,
  CustomIconButton,
  EntryDescriptionDrawer,
  Experiment,
  ExternalLink,
  FiveStar,
  FmpIcon,
  HtmlWrapper,
  PageContainer,
  PageWithDrawer,
  RedditLogInDialog,
  RedditUserAttribution,
  Countdown,
  VotingSlider,
  SpinnerButton,
} from '../../components';

import CardImageLink from './CardImageLink';
import ContestCategorySelector from './ContestCategorySelector';
import ContestSettings from './ContestSettings';
import Subheader from './Subheader';

const scrollInstantlyTo = (scrollY) => {
  animateScroll.scrollTo(scrollY, { duration: 0, delay: 0 });
};

const useStyles = makeStyles((theme) => ({
  descriptionIcon: {
    paddingLeft: 4,
    top: -4,
  },
  disabledVoting: {
    cursor: 'wait',
  },
  divider: {
    height: 2,
    marginBottom: 16,
  },
  entriesLoading: {
    visibility: 'hidden',
  },
  entry: {
    backgroundColor: theme.palette.grey[100],
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  entryHeading: {
    columnGap: 4,
    display: 'flex',
    minHeight: 60,
    padding: 8,
  },
  entryImageContainer: {
    alignItems: 'center',
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
  },
  entryInfo: {
    display: 'flex',
    flexGrow: 1,
    paddingTop: 4,
  },
  entryRatings: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    textAlign: 'end',
  },
  heading: {
    margin: '24px auto',
  },
  icon: {
    color: theme.palette.grey[700],
  },
  myRating: {
    color: theme.palette.grey[600],
    display: 'flex',
    fontStyle: 'italic',
    justifyContent: 'right',
  },
  numberSymbol: {
    marginRight: 4,
  },
  sponsorBanner: {
    alignItems: 'center',
    backgroundColor: theme.palette.flagMakerPrint.main,
    color: theme.palette.common.white,
    columnGap: 8,
    display: 'flex',
    justifyContent: 'center',
    padding: 8,
    '&:hover': {
      textDecoration: 'none',
    },
  },
  sponsorIcon: {
    fill: theme.palette.common.white,
    width: 24,
  },
  votingSlider: {
    marginTop: 16,
  },
  winnerCard: {
    marginTop: 4,
    marginBottom: 16,
  },
  winnerContent: {
    flexGrow: 1,
    paddingTop: 4,
  },
  winnerHeading: {
    columnGap: 8,
    display: 'flex',
  },
}));

const imageWidths = {
  default: {
    lg: 400,
    md: 448,
    sm: 552,
  },
  compact: {
    lg: 302,
    md: 299,
    sm: 272,
  },
  full: {
    lg: 1280,
    md: 960,
    sm: 600,
  },
};

let scrollingIntervalId;

function Contest() {
  const navigate = useNavigate();
  const { contestId } = useParams();
  const [scroll, setScroll] = useScrollState();

  const apiPath = `/contests/${contestId}`;
  const { data: contest, isValidating, mutate } = useSwrData(apiPath, false);
  const updateCache = useCache(apiPath)[1];

  if (contest?.submissionWindowOpen) {
    navigate('/submission', { replace: true });
  }

  const { state = {} } = useLocation();
  const [isLoaded, setLoaded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(state?.selectedCategories ?? []);
  const [descriptionEntryId, setDescriptionEntryId] = useState(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [votingExpired, setVotingExpired] = useState(false);
  const [{ votingDisabled }, setComponentsState] = useComponentsState();

  const updateScroll = () => {
    setScroll({
      y: window.scrollY,
    });
  };

  useEffect(() => {
    forceCheck();
  }, [isLoaded]);

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

  useEffect(() => {
    forceCheck();
    window.history.pushState(
      { usr: { ...window.history.state?.usr, selectedCategories } },
      document.title,
    );
  }, [selectedCategories]);

  const viewDescription = (entryId) => {
    setDescriptionEntryId(entryId);
    setSettingsOpen(true);
  };

  const [{ density = 'default' }] = useSettingsState();

  const toggleSettingsOpen = () => {
    setSettingsOpen(!isSettingsOpen);
  };

  const backLink = (state || {}).back || '/contests';

  const handleVotingExpired = () => {
    updateCache(null);
    setVotingExpired(true);
  };

  const handleReload = () => {
    setLoaded(false);
    scrollInstantlyTo(0);
    window.location.reload();
  };

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  let key;
  if (isLgUp) {
    key = 'lg';
  } else if (isMdUp) {
    key = 'md';
  } else if (isSmUp) {
    key = 'sm';
  }

  const clientWidth = useClientWidth();
  const defaultContainerWidth = clientWidth - 32;

  let gridDisplayWidth = defaultContainerWidth;
  let winnerDisplayWidth = defaultContainerWidth;
  if (key) {
    gridDisplayWidth = imageWidths[density][key];
    winnerDisplayWidth = imageWidths.full[key] - 48;
  }

  const classes = useStyles();

  const getGridVariables = (fullWidth) => {
    const xs = 12;
    let sm = 12;
    let md = 6;
    let lg = 4;

    if (fullWidth) {
      md = 12;
      lg = 12;
    } else if (density === 'compact') {
      sm = 6;
      md = 4;
      lg = 3;
    }

    return {
      xs,
      sm,
      md,
      lg,
    };
  };

  const headingVariant = isSmUp ? 'h3' : 'h5';

  const votingUnavailable = votingDisabled || votingExpired;

  const {
    categories,
    date,
    entries,
    isContestMode,
    localVoting,
    name,
    subtext,
    validRedditId,
    voteEnd,
    votingWindowOpen,
    winners,
    winnersThreadId,
  } = contest;
  const voteEndDate = new Date(voteEnd);

  return (
    <PageWithDrawer
      handleClose={() => {
        setSettingsOpen(false);
        setTimeout(() => {
          setDescriptionEntryId(null);
        }, 200);
      }}
      isOpen={isSettingsOpen}
      appBar={{
        className: classes.icon,
        color: 'default',
        right: (
          <>
            {!localVoting && validRedditId && (
              <CustomIconButton
                href={`https://redd.it/${contestId}`}
                ariaLabel="Open voting thread"
                Icon={ThumbsUpDownOutlinedIcon}
              />
            )}
            {winnersThreadId && (
              <CustomIconButton
                href={`https://redd.it/${winnersThreadId}`}
                ariaLabel="Open winners thread"
                Icon={EmojiEventsOutlinedIcon}
              />
            )}
            <CustomIconButton
              ariaLabel="View settings"
              onClick={toggleSettingsOpen}
              Icon={SettingsOutlinedIcon}
            />
          </>
        ),
        children: (
          <>
            <ArrowBackButton state={{ date }} to={backLink} />
            {isContestMode && (
              <Box display="inline-flex" paddingLeft={1.5}>
                <Countdown
                  endDate={voteEndDate}
                  handleExpiry={handleVotingExpired}
                  handleReload={handleReload}
                />
              </Box>
            )}
          </>
        ),
      }}
      drawer={
        descriptionEntryId
          ? { heading: 'Info', children: <EntryDescriptionDrawer entryId={descriptionEntryId} /> }
          : {
            heading: 'Settings',
            children: <ContestSettings />,
          }
      }
    >
      <ExternalLink
        className={classes.sponsorBanner}
        href="https://flagmaker-print.com/"
        target="_blank"
      >
        <FmpIcon className={classes.sponsorIcon} />
        <Typography component="span" variant="subtitle2">
          Powered by Flagmaker & Print ~ Design and Print your own flags!
        </Typography>
      </ExternalLink>
      {name && (
        <PageContainer className={clsx({ [classes.entriesLoading]: !isLoaded })} fixed>
          <Typography className={classes.heading} variant={headingVariant} component="h1">
            {name}
          </Typography>
          {votingWindowOpen === false && (
            <>
              <Box marginBottom={2}>
                We are working on getting the contest ready! Please check again soon.
              </Box>
              <SpinnerButton
                color="primary"
                disabled={isValidating}
                onClick={() => {
                  mutate();
                }}
                submitting={isValidating}
                variant="contained"
              >
                Refresh
              </SpinnerButton>
            </>
          )}
          {isContestMode && subtext && (
            <Box marginBottom={3}>
              <Typography component="div" variant="subtitle1">
                <HtmlWrapper html={subtext} />
              </Typography>
            </Box>
          )}
          <ContestCategorySelector {...{ categories, selectedCategories, setSelectedCategories }} />
          {winners && winners.length > 0 && (
            <>
              <Subheader>Top 20</Subheader>
              {winners.map(({
                height, id, imagePath, name: entryName, rank, user, width,
              }) => (
                <React.Fragment key={id}>
                  <div id={id} className={classes.winnerHeading}>
                    <Typography variant={headingVariant}>
                      <span className={classes.numberSymbol}>#</span>
                      {rank}
                    </Typography>
                    <div className={classes.winnerContent}>
                      <Typography variant="subtitle2">{entryName}</Typography>
                      <Typography variant="caption">
                        <RedditUserAttribution user={user} />
                      </Typography>
                    </div>
                  </div>
                  <Card className={classes.winnerCard} elevation={2}>
                    <CardImageLink
                      displayWidth={winnerDisplayWidth}
                      height={height}
                      id={id}
                      image={imagePath}
                      onClick={updateScroll}
                      width={width}
                    />
                  </Card>
                </React.Fragment>
              ))}
              <Divider className={classes.divider} />
              <Subheader>All other entries</Subheader>
            </>
          )}
          {entries && (
            <Grid container spacing={density === 'compact' ? 1 : 2}>
              {entries
                .filter(
                  // eslint-disable-next-line max-len
                  ({ category }) => !selectedCategories.length || selectedCategories.includes(category),
                )
                .map(
                  ({
                    average,
                    category,
                    categoryRank,
                    id,
                    imagePath,
                    imgurId,
                    height,
                    name: entryName,
                    rank,
                    rating,
                    user,
                    width,
                  }) => (
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    <Grid key={id} item {...getGridVariables(rank === '1')}>
                      <Card id={id} className={classes.entry}>
                        <CardContent className={classes.entryHeading}>
                          {rank && (
                            <Typography component="div" variant="h6">
                              <span className={classes.numberSymbol}>#</span>
                              {rank}
                            </Typography>
                          )}
                          <div className={classes.entryInfo}>
                            <Box alignItems="flex-start" display="flex" flexGrow={1}>
                              <Box flexGrow={1}>
                                <Typography component="div" variant="subtitle2">
                                  {entryName}
                                </Typography>
                                {user && (
                                  <Typography variant="caption">
                                    <RedditUserAttribution user={user} />
                                  </Typography>
                                )}
                              </Box>
                              <Experiment name="contest_card_description">
                                <CustomIconButton
                                  ariaLabel="View description"
                                  className={classes.descriptionIcon}
                                  Icon={DescriptionIcon}
                                  onClick={() => {
                                    viewDescription(id);
                                  }}
                                  size="small"
                                />
                              </Experiment>
                            </Box>
                            {(!isContestMode || category) && (
                              <div className={classes.entryRatings}>
                                {category && (
                                  <CategoryLabel
                                    categories={categories}
                                    category={category}
                                    categoryRank={categoryRank}
                                  />
                                )}
                                {!isContestMode && (
                                  <>
                                    <Average average={average} fullText={rank === '1'} />
                                    {rating > -1 && (
                                      <Typography className={classes.myRating} variant="caption">
                                        {rank === '1' && <span>My&nbsp;rating:&nbsp;</span>}
                                        <FiveStar rating={rating} />
                                      </Typography>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <div className={classes.entryImageContainer}>
                          <CardImageLink
                            displayWidth={rank === '1' ? winnerDisplayWidth : gridDisplayWidth}
                            height={height}
                            id={id}
                            image={imagePath}
                            nextState={{ selectedCategories }}
                            onClick={updateScroll}
                            width={width}
                          />
                        </div>
                        {isContestMode && (
                          <CardActions
                            className={clsx(classes.votingSlider, {
                              [classes.disabledVoting]: votingDisabled,
                            })}
                          >
                            <VotingSlider
                              disabled={votingUnavailable}
                              entryId={imgurId ?? id}
                              rating={rating}
                              setComponentsState={setComponentsState}
                            />
                          </CardActions>
                        )}
                      </Card>
                    </Grid>
                  ),
                )}
            </Grid>
          )}
        </PageContainer>
      )}
      <RedditLogInDialog />
    </PageWithDrawer>
  );
}

export default Contest;
