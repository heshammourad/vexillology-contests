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
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';

import {
  useComponentsState,
  useSettingsState,
  useSwrData,
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
  setExperimentDrawer,
  votingExpired,
}) {
  const { contestId } = useParams();

  const apiPath = `/contests/${contestId}`;
  const { data: contest } = useSwrData(apiPath, false);

  const classes = useStyles();
  const [{ votingDisabled }, setComponentsState] = useComponentsState();
  const { gridDisplayWidth, winnerDisplayWidth } = useContestSizing();

  const [{ density = 'default' }] = useSettingsState();

  const votingUnavailable = votingDisabled || votingExpired;

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
                            setExperimentDrawer(id);
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
  );
}

ContestGrid.propTypes = {
  selectedCategories: PropTypes.arrayOf(PropTypes.string),
  setExperimentDrawer: PropTypes.func.isRequired,
  votingExpired: PropTypes.bool,
};

ContestGrid.defaultProps = {
  selectedCategories: [],
  votingExpired: true,
};

export default ContestGrid;
