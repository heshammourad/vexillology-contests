/**
 * Record and display user's vote
 */

import Button from '@material-ui/core/Button';
import Slider from '@material-ui/core/Slider';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

import useVoting from '../data/useVoting';
import useVotingStatus from '../data/useVotingStatus';

const MIN_SCORE = 0;
const MAX_SCORE = 5;

const ThemedSlider = withStyles((theme) => ({
  root: {
    color: theme.palette.primary.main,
    margin: '0 8px',
  },
  active: {},
  mark: {
    color: theme.palette.primary.main,
    height: 8,
    marginTop: -3,
    width: 2,
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor',
  },
  markLabel: {
    color: theme.palette.grey[800],
  },
  thumb: {
    color: theme.palette.primary.main,
    '&:focus, &:hover, &$active': {
      boxShadow: '0px 0px 0px 8px rgba(255, 69, 0, 0.16)',
    },
  },
  valueLabel: {
    fontSize: '0.875rem',
    top: -22,
    '& *': {
      background: 'transparent',
      color: theme.palette.text.primary,
    },
  },
}))(Slider);

const useStyles = makeStyles((theme) => ({
  clearVoteButton: {
    flexShrink: 0,
    marginLeft: theme.spacing(1),
  },
  disabled: {
    color: theme.palette.grey[600],
    '& .MuiSlider-mark': {
      color: theme.palette.grey[600],
    },
    '& .MuiSlider-thumb': {
      color: theme.palette.grey[600],
    },
    '& .MuiSlider-valueLabel': {
      color: theme.palette.grey[600],
      left: -12,
    },
  },
  unrated: {
    color: theme.palette.grey[600],
    '& .MuiSlider-mark': {
      color: theme.palette.grey[600],
    },
    '& .MuiSlider-thumb': {
      visibility: 'hidden',
    },
  },
}));

function VotingSlider({
  entryId, rating,
}) {
  const { votingUnavailable: disabled } = useVotingStatus();
  const ratingRef = useRef(rating);

  const { changeRating, clearRating } = useVoting(entryId);

  const classes = useStyles();

  useEffect(() => {
    ratingRef.current = rating;
  }, [rating]);

  const handleSliderChange = async (event, newValue) => {
    changeRating(newValue, ratingRef.current);
  };

  const isUnrated = !rating && rating !== 0;

  return (
    <>
      <ThemedSlider
        className={clsx({ [classes.disabled]: disabled, [classes.unrated]: isUnrated })}
        aria-label="Vote on flag"
        disabled={disabled}
        marks
        min={MIN_SCORE}
        max={MAX_SCORE}
        step={1}
        onChange={handleSliderChange}
        value={rating}
        valueLabelDisplay="on"
      />
      <Button
        className={classes.clearVoteButton}
        color="primary"
        disabled={disabled || isUnrated}
        size="small"
        onClick={clearRating}
      >
        Clear Vote
      </Button>
    </>
  );
}

VotingSlider.propTypes = {
  entryId: PropTypes.string.isRequired,
  rating: PropTypes.number,
};

VotingSlider.defaultProps = {
  rating: null,
};

export default VotingSlider;
