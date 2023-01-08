import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import RadioGroup from '@material-ui/core/RadioGroup';
import Typography from '@material-ui/core/Typography';
import grey from '@material-ui/core/colors/grey';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import EmojiEventsOutlinedIcon from '@material-ui/icons/EmojiEventsOutlined';
import ScheduleIcon from '@material-ui/icons/Schedule';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import ThumbsUpDownOutlinedIcon from '@material-ui/icons/ThumbsUpDownOutlined';
import clsx from 'clsx';
import differenceInDays from 'date-fns/differenceInDays';
import isFuture from 'date-fns/isFuture';
import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { animateScroll } from 'react-scroll';

import {
  useClientWidth,
  useScrollState,
  useSettingsState,
  useSwrData,
  useVotingComponentsState,
} from '../../common';
import {
  AccountMenu,
  ArrowBackButton,
  CountdownTimer,
  CustomIconButton,
  CustomRadio,
  CustomSwitch,
  FiveStar,
  PageWithDrawer,
  RedditUserAttribution,
  VotingComponents,
  VotingSlider,
} from '../../components';

import CardImageLink from './CardImageLink';
import Subheader from './Subheader';

const scrollInstantlyTo = (scrollY) => {
  animateScroll.scrollTo(scrollY, { duration: 0, delay: 0 });
};

const useStyles = makeStyles((theme) => ({
  heading: {
    margin: '24px auto',
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
  entryName: {
    color: 'black',
    flexGrow: 1,
  },
  hiddenTitle: {
    marginTop: 16,
  },
  icon: {
    color: '#5f6368',
  },
  listItemText: {
    color: '#3c4043',
  },
  listSubheader: {
    color: '#202124',
    fontSize: '.6875rem',
    fontWeight: 500,
    letterSpacing: '.8px',
    lineHeight: 1,
    margin: '16px 0',
    textTransform: 'uppercase',
  },
  myRating: {
    color: grey[600],
    display: 'flex',
    fontStyle: 'italic',
  },
  numberSymbol: {
    marginRight: 4,
    [theme.breakpoints.up('sm')]: {
      marginRight: 8,
    },
  },
  subheader: {
    margin: '16px auto',
  },
  switch: {
    color: '#4285f4',
  },
  voteCountdown: {
    alignItems: 'center',
    display: 'inline-flex',
    padding: 12,
  },
  voteCountdownLabel: {
    lineHeight: '24px',
    paddingLeft: 12,
  },
  voteCountdownWarning: {
    color: theme.palette.error.main,
  },
  winnerCard: {
    marginTop: 4,
    marginBottom: 16,
  },
  winnerContent: {
    flexGrow: 1,
    [theme.breakpoints.up('sm')]: {
      paddingTop: 8,
    },
  },
  winnerHeading: {
    columnGap: 8,
    display: 'flex',
    [theme.breakpoints.up('sm')]: {
      columnGap: 16,
    },
  },
  winnerRatings: {
    textAlign: 'end',
    [theme.breakpoints.up('sm')]: {
      paddingTop: 8,
    },
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
  const { contestId } = useParams();
  const [scroll, setScroll] = useScrollState();
  const contest = useSwrData(`/contests/${contestId}`, !!scroll.entryId) || {};

  const { state = {} } = useLocation();
  const [isLoaded, setLoaded] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [{ votingDisabled }, setVotingComponentsState] = useVotingComponentsState();

  useEffect(() => {
    setVotingComponentsState();
  }, []);

  const updateScroll = () => {
    setScroll({
      y: window.scrollY,
    });
  };

  useEffect(() => {
    if (!contest.name) {
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
        clearInterval(scrollingIntervalId);
        scrollingIntervalId = null;
      }, 50);
    }
  }, [state, contest]);

  const [{ density = 'default', isHideTitles }, updateSettings] = useSettingsState();

  const toggleHideTitles = () => {
    updateSettings('isHideTitles', !isHideTitles);
  };

  const handleDensityChange = (event) => {
    updateSettings('density', event.target.value);
  };

  const toggleSettingsOpen = () => {
    setSettingsOpen(!isSettingsOpen);
  };

  const backLink = (state || {}).back || '/contests';

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

  const getGridVariables = () => {
    let spacing = 2;
    const xs = 12;
    let sm = 12;
    let md = 6;
    let lg = 4;
    if (density === 'compact') {
      spacing = 1;
      sm = 6;
      md = 4;
      lg = 3;
    }
    return {
      spacing,
      xs,
      sm,
      md,
      lg,
    };
  };
  const {
    spacing, xs, sm, md, lg,
  } = getGridVariables();

  const headingVariant = isSmUp ? 'h3' : 'h5';
  const {
    date, entries, name, validRedditId, voteEnd, winners, winnersThreadId,
  } = contest;
  const voteEndDate = new Date(voteEnd);
  const allowVoting = voteEnd && isFuture(voteEndDate);
  return (
    <PageWithDrawer
      handleClose={() => {
        setSettingsOpen(false);
      }}
      isOpen={isSettingsOpen}
      appBar={{
        className: classes.icon,
        color: 'default',
        right: (
          <>
            {validRedditId && (
              <>
                <CustomIconButton
                  href={`https://redd.it/${contestId}`}
                  ariaLabel="Open voting thread"
                  Icon={ThumbsUpDownOutlinedIcon}
                />
                {winnersThreadId && (
                  <CustomIconButton
                    href={`https://redd.it/${winnersThreadId}`}
                    ariaLabel="Open winners thread"
                    Icon={EmojiEventsOutlinedIcon}
                  />
                )}
              </>
            )}
            <CustomIconButton
              ariaLabel="View settings"
              onClick={toggleSettingsOpen}
              Icon={SettingsOutlinedIcon}
            />
            <AccountMenu />
          </>
        ),
        children: (
          <>
            <ArrowBackButton state={{ date }} to={backLink} />
            {allowVoting && (
              <div
                className={clsx(classes.voteCountdown, {
                  [classes.voteCountdownWarning]: !differenceInDays(voteEndDate, new Date()),
                })}
              >
                <ScheduleIcon />
                <Typography className={classes.voteCountdownLabel} variant="body2">
                  <CountdownTimer end={voteEndDate} />
                  {' '}
                  left to vote!
                </Typography>
              </div>
            )}
          </>
        ),
      }}
      drawer={{
        heading: 'Settings',
        children: (
          <>
            <List
              subheader={<ListSubheader className={classes.listSubheader}>Display</ListSubheader>}
            >
              <ListItem>
                <ListItemText
                  className={classes.listItemText}
                  id="switch-list-label-hide-titles"
                  primary="Hide Titles"
                />
                <ListItemSecondaryAction>
                  <CustomSwitch
                    edge="end"
                    onChange={toggleHideTitles}
                    checked={isHideTitles}
                    inputProps={{ 'aria-labelledby': 'switch-list-label-hide-titles' }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            <Divider />
            <FormControl component="fieldset">
              <List
                dense
                subheader={(
                  <ListSubheader>
                    <FormLabel className={classes.listSubheader}>Density</FormLabel>
                  </ListSubheader>
                )}
              >
                <RadioGroup
                  aria-label="density"
                  name="density"
                  value={density}
                  onChange={handleDensityChange}
                >
                  <ListItem>
                    <FormControlLabel
                      value="default"
                      control={<CustomRadio color="primary" />}
                      label="Default"
                    />
                  </ListItem>
                  <ListItem>
                    <FormControlLabel
                      value="compact"
                      control={<CustomRadio color="primary" />}
                      label="Compact"
                    />
                  </ListItem>
                </RadioGroup>
              </List>
            </FormControl>
          </>
        ),
      }}
    >
      {name && (
        <Container className={clsx({ [classes.entriesLoading]: !isLoaded })} fixed>
          <Typography className={classes.heading} variant={headingVariant} component="h1">
            {name}
          </Typography>
          {winners && winners.length > 0 && (
            <>
              <Subheader>Top 20</Subheader>
              {winners.map(
                ({
                  average,
                  height,
                  id,
                  imgurLink,
                  name: entryName,
                  rank,
                  rating,
                  user,
                  width,
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
                      <div className={classes.winnerRatings}>
                        <Typography variant="subtitle2">
                          Average&nbsp;rating:&nbsp;
                          {average}
                        </Typography>
                        {rating && (
                          <Typography className={classes.myRating} variant="caption">
                            My&nbsp;rating:&nbsp;
                            <FiveStar rating={rating} />
                          </Typography>
                        )}
                      </div>
                    </div>
                    <Card className={classes.winnerCard} elevation={2}>
                      <CardImageLink
                        displayWidth={winnerDisplayWidth}
                        height={height}
                        id={id}
                        image={imgurLink}
                        onClick={updateScroll}
                        width={width}
                      />
                    </Card>
                  </React.Fragment>
                ),
              )}
              <Divider className={classes.divider} />
              <Subheader>All other entries</Subheader>
            </>
          )}
          {entries && (
            <Grid container spacing={spacing}>
              {entries.map(({
                id, imgurId, imgurLink, height, name: entryName, rating, width,
              }) => (
                <Grid key={id} item xs={xs} sm={sm} md={md} lg={lg}>
                  <Card id={id}>
                    <CardImageLink
                      displayWidth={gridDisplayWidth}
                      height={height}
                      id={id}
                      image={imgurLink}
                      onClick={updateScroll}
                      width={width}
                    />
                    {!isHideTitles && (
                    <CardContent>
                      <Box display="flex" gridGap={8}>
                        <Typography className={classes.entryName} variant="caption">
                          {entryName}
                        </Typography>
                        {rating > -1 && <FiveStar rating={rating} />}
                      </Box>
                    </CardContent>
                    )}
                    {allowVoting && (
                    <CardActions
                      className={clsx({
                        [classes.disabledVoting]: votingDisabled,
                        [classes.hiddenTitle]: isHideTitles,
                      })}
                      disableSpacing
                    >
                      <VotingSlider
                        disabled={votingDisabled}
                        entryId={imgurId}
                        rating={rating}
                        setVotingComponentsState={setVotingComponentsState}
                      />
                    </CardActions>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      )}
      <VotingComponents />
    </PageWithDrawer>
  );
}

export default Contest;
