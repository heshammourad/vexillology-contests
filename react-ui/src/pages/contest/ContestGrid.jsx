/**
 * Display grid for contests
 */

import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import DescriptionIcon from '@material-ui/icons/Description';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';

import {
  useSettingsState,
} from '../../common';
import {
  Average,
  CategoryLabel,
  CustomIconButton,
  Experiment,
  FiveStar,
  RedditUserAttribution,
  VotingSlider,
} from '../../components';
import useSwrContest from '../../data/useSwrContest';
import useVotingStatus from '../../data/useVotingStatus';

import CardImageLink from './CardImageLink';
import useContestSizing from './useContestSizing';

const useStyles = makeStyles((theme) => ({
  descriptionIcon: {
    paddingLeft: 4,
    top: -4,
  },
  disabledVoting: {
    cursor: 'wait',
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
  myRating: {
    color: theme.palette.grey[600],
    display: 'flex',
    fontStyle: 'italic',
    justifyContent: 'right',
  },
  numberSymbol: {
    marginRight: 4,
  },
  votingSlider: {
    marginTop: 16,
  },
}));

function ContestGrid({
  selectedCategories,
  setDrawer,
}) {
  const { votingDisabled } = useVotingStatus();
  const { data: contest } = useSwrContest();

  const classes = useStyles();
  const { gridDisplayWidth, winnerDisplayWidth } = useContestSizing();

  const [{ density = 'default' }] = useSettingsState();

  const getGridVariables = useCallback((fullWidth) => {
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
  }, [density]);

  const {
    categories,
    entries,
    isContestMode,
  } = contest;

  if (!entries) {
    return null;
  }

  return (
    <Grid container spacing={density === 'compact' ? 1 : 2}>
      {entries
        .filter(
          ({ category }) => !selectedCategories.length
            || selectedCategories.includes(category),
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
              <Card id={id} className={classes.entry} sx={{ maxWidth: rank === '1' ? winnerDisplayWidth : gridDisplayWidth }}>
                <CardContentWrapper {...{
                  average,
                  category,
                  categories,
                  categoryRank,
                  entryName,
                  id,
                  isContestMode,
                  rank,
                  rating,
                  setDrawer,
                  user,
                }}
                />
                <div className={classes.entryImageContainer}>
                  <CardImageLink
                    displayWidth={rank === '1' ? winnerDisplayWidth : gridDisplayWidth}
                    height={height}
                    id={id}
                    image={imagePath}
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
                      entryId={imgurId ?? id}
                      rating={rating}
                    />
                  </CardActions>
                )}
              </Card>
            </Grid>
          ),
        )}
    </Grid>
  );
}

// ??? Unknown issue: selecting entry re-renders ContestGrid
// And without wrapper, CardContent causes 150-200ms delay
function CardContentWrapper({
  average,
  category,
  categories, // is this the issue?
  categoryRank,
  entryName,
  id,
  isContestMode, // is this the issue?
  rank,
  rating,
  setDrawer, // is this the issue?
  user,
}) {
  const classes = useStyles();

  const cardContent = useMemo(() => (
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
                setDrawer(id);
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
  ), [
    average,
    category,
    categories,
    categoryRank,
    entryName,
    id,
    isContestMode,
    rank,
    rating,
    setDrawer,
    user,
  ]);

  return cardContent;
}

ContestGrid.propTypes = {
  selectedCategories: PropTypes.arrayOf(PropTypes.string),
  setDrawer: PropTypes.func.isRequired,
};

ContestGrid.defaultProps = {
  selectedCategories: [],
};

export default ContestGrid;
