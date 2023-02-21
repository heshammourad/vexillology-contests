import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Chip from '@material-ui/core/Chip';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListSubheader from '@material-ui/core/ListSubheader';
import MenuItem from '@material-ui/core/MenuItem';
import RadioGroup from '@material-ui/core/RadioGroup';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import EmojiEventsOutlinedIcon from '@material-ui/icons/EmojiEventsOutlined';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import ThumbsUpDownOutlinedIcon from '@material-ui/icons/ThumbsUpDownOutlined';
import clsx from 'clsx';
import isFuture from 'date-fns/isFuture';
import React, { useState, useEffect } from 'react';
import { forceCheck } from 'react-lazyload';
import { useLocation, useParams } from 'react-router-dom';
import { animateScroll } from 'react-scroll';

import {
  useClientWidth,
  useScrollState,
  useSettingsState,
  useSwrData,
  useComponentsState,
} from '../../common';
import {
  ArrowBackButton,
  Average,
  CustomIconButton,
  CustomRadio,
  ExternalLink,
  FiveStar,
  FmpIcon,
  HtmlWrapper,
  PageWithDrawer,
  RedditLogInDialog,
  RedditUserAttribution,
  VotingCountdown,
  VotingSlider,
} from '../../components';

import CardImageLink from './CardImageLink';
import Subheader from './Subheader';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const CATEGORY_MENU_PROPS = {
  PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 } },
};
const FILTER_CATEGORIES_LABEL_ID = 'filter-categories-label';

const scrollInstantlyTo = (scrollY) => {
  animateScroll.scrollTo(scrollY, { duration: 0, delay: 0 });
};

const useStyles = makeStyles((theme) => ({
  categories: {
    alignItems: 'center',
    columnGap: 8,
    display: 'flex',
    marginBottom: 16,
    maxWidth: 600,
    minHeight: 50,
    minWidth: 120,
  },
  categoryChip: {
    margin: 2,
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
    flexGrow: 1,
    textAlign: 'end',
  },
  heading: {
    margin: '24px auto',
  },
  icon: {
    color: theme.palette.grey[700],
  },
  listSubheader: {
    color: theme.palette.grey[900],
    fontSize: '.6875rem',
    fontWeight: 500,
    letterSpacing: '.8px',
    lineHeight: 1,
    margin: '16px 0',
    textTransform: 'uppercase',
  },
  myRating: {
    color: theme.palette.grey[600],
    display: 'flex',
    fontStyle: 'italic',
  },
  numberSymbol: {
    marginRight: 4,
  },
  selectedCategory: {
    fontWeight: theme.typography.fontWeightMedium,
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
  winnerRatings: {
    flexShrink: 0,
    paddingTop: 4,
    textAlign: 'end',
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
  const [contest] = useSwrData(`/contests/${contestId}`, !!scroll.entryId);

  const { state = {} } = useLocation();
  const [isLoaded, setLoaded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(state?.selectedCategories ?? []);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [{ votingDisabled }, setComponentsState] = useComponentsState();

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
        window.history.pushState({ usr: { selectedCategories } }, document.title);
        clearInterval(scrollingIntervalId);
        scrollingIntervalId = null;
      }, 50);
    }
  }, [state, contest]);

  useEffect(() => {
    forceCheck();
    window.history.pushState(
      { usr: { ...window.history.state.usr, selectedCategories } },
      document.title,
    );
  }, [selectedCategories]);

  const handleCategoryChange = (event) => {
    setSelectedCategories(event.target.value.sort());
  };

  const resetSelectedCategories = () => {
    setSelectedCategories([]);
  };

  const [{ density = 'default' }, updateSettings] = useSettingsState();

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
  const {
    categories,
    date,
    entries,
    localVoting,
    name,
    subtext,
    validRedditId,
    voteEnd,
    winners,
    winnersThreadId,
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
            {allowVoting && (
              <Box display="inline-flex" padding={1.5}>
                <VotingCountdown voteEndDate={voteEndDate} />
              </Box>
            )}
          </>
        ),
      }}
      drawer={{
        heading: 'Settings',
        children: (
          <FormControl component="fieldset">
            <List
              dense
              subheader={<ListSubheader className={classes.listSubheader}>Density</ListSubheader>}
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
        ),
      }}
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
        <Container className={clsx({ [classes.entriesLoading]: !isLoaded })} fixed>
          <Typography className={classes.heading} variant={headingVariant} component="h1">
            {name}
          </Typography>
          {allowVoting && subtext && (
            <Box marginBottom={3}>
              <Typography component="div" variant="subtitle1">
                <HtmlWrapper html={subtext} />
              </Typography>
            </Box>
          )}
          {categories?.length > 0 && (
            <div className={classes.categories}>
              <Typography id={FILTER_CATEGORIES_LABEL_ID} variant="caption">
                Filter categories:
              </Typography>
              <Select
                input={<Input />}
                labelId={FILTER_CATEGORIES_LABEL_ID}
                MenuProps={CATEGORY_MENU_PROPS}
                multiple
                onChange={handleCategoryChange}
                renderValue={(selected) => (
                  <Box display="flex" flexWrap="wrap">
                    {selected.map((value) => (
                      <Chip className={classes.categoryChip} key={value} label={value} />
                    ))}
                  </Box>
                )}
                value={selectedCategories}
              >
                {categories.map((category) => (
                  <MenuItem
                    className={clsx({
                      [classes.selectedCategory]: selectedCategories.includes(category),
                    })}
                    key={category}
                    value={category}
                  >
                    {category}
                  </MenuItem>
                ))}
              </Select>
              <Button
                disabled={!selectedCategories.length}
                size="small"
                onClick={resetSelectedCategories}
              >
                Reset
              </Button>
            </div>
          )}
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
                        <Average average={average} />
                        {rating > -1 && (
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
            <Grid container spacing={density === 'compact' ? 1 : 2}>
              {entries
                .filter(
                  // eslint-disable-next-line max-len
                  ({ category }) => !selectedCategories.length || selectedCategories.includes(category),
                )
                .map(
                  ({
                    average,
                    id,
                    imgurId,
                    imgurLink,
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
                          <div className={clsx({ [classes.entryInfo]: !!rank })}>
                            <div>
                              <Typography component="div" variant="subtitle2">
                                {entryName}
                              </Typography>
                              {user && (
                                <Typography variant="caption">
                                  <RedditUserAttribution user={user} />
                                </Typography>
                              )}
                            </div>
                            {!allowVoting && (
                              <div className={classes.entryRatings}>
                                <Average average={average} fullText={false} />
                                {rating > -1 && <FiveStar rating={rating} />}
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <div className={classes.entryImageContainer}>
                          <CardImageLink
                            displayWidth={rank === '1' ? winnerDisplayWidth : gridDisplayWidth}
                            height={height}
                            id={id}
                            image={imgurLink}
                            nextState={{ selectedCategories }}
                            onClick={updateScroll}
                            width={width}
                          />
                        </div>
                        {allowVoting && (
                          <CardActions
                            className={clsx(classes.votingSlider, {
                              [classes.disabledVoting]: votingDisabled,
                            })}
                          >
                            <VotingSlider
                              disabled={votingDisabled}
                              entryId={imgurId}
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
        </Container>
      )}
      <RedditLogInDialog />
    </PageWithDrawer>
  );
}

export default Contest;
