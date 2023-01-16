import Button from '@material-ui/core/Button';
import Slider from '@material-ui/core/Slider';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useSWRMutation from 'swr/mutation';

import { deleteData, putData } from '../api';
import { useAuthState, useSwrData } from '../common';

const MIN_SCORE = 0;
const MAX_SCORE = 5;
const URL = '/votes';

const ThemedSlider = withStyles((theme) => ({
  root: {
    color: theme.palette.vexyOrange.main,
    margin: '0 8px',
  },
  active: {},
  mark: {
    color: theme.palette.vexyOrange.main,
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
    color: theme.palette.vexyOrange.main,
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

const updateEntries = (entries, { entryId, rating }) => entries.reduce((acc, cur) => {
  if (cur.imgurId !== entryId) {
    acc.push(cur);
  } else {
    acc.push({ ...cur, rating });
  }
  return acc;
}, []);

function VotingSlider({
  disabled, entryId, rating, setComponentsState,
}) {
  const { contestId } = useParams();

  const [{ accessToken, isLoggedIn, refreshToken }] = useAuthState();
  const authTokens = { accessToken, refreshToken };

  const [isInteractive, setInteractive] = useState(false);

  const url = `/contests/${contestId}`;
  const updateCache = useSwrData(url)[1];
  const key = [url, authTokens];
  // eslint-disable-next-line max-len
  const { isMutating: isMutatingPut, trigger: triggerPut } = useSWRMutation(key, (_, { arg }) => putData(URL, arg, authTokens));
  const { isMutating: isMutatingDelete, trigger: triggerDelete } = useSWRMutation(
    key,
    (_, { arg }) => deleteData(URL, arg, authTokens),
  );

  const classes = useStyles();

  useEffect(() => {
    if (isInteractive) {
      setComponentsState('votingDisabled', isMutatingDelete || isMutatingPut);
    }
  }, [isInteractive, isMutatingDelete, isMutatingPut]);

  const showError = () => {
    setComponentsState('votingErrorSnackbarOpenTimestamp', Date.now());
  };

  const triggerOptions = (input) => ({
    optimisticData: (current) => ({ ...current, entries: updateEntries(current.entries, input) }),
    revalidate: false,
    populateCache: (response, contest) => {
      if (!response) {
        showError();
        return contest;
      }

      const newEntries = updateEntries(contest.entries, input);
      const newData = { ...contest, entries: newEntries };
      updateCache(newData);
      return newData;
    },
    onError: () => {
      showError();
    },
  });

  const handleSliderChange = async (event, newValue) => {
    if (!isLoggedIn) {
      setComponentsState('redditLogInDialogOpen', true);
      return;
    }

    setInteractive(true);

    const voteInput = { contestId, entryId, rating: newValue };
    triggerPut(voteInput, triggerOptions(voteInput));
  };

  const clearRating = () => {
    setInteractive(true);

    const input = { contestId, entryId };
    triggerDelete(input, triggerOptions(input));
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
  disabled: PropTypes.bool,
  entryId: PropTypes.string.isRequired,
  rating: PropTypes.number,
  setComponentsState: PropTypes.func.isRequired,
};

VotingSlider.defaultProps = {
  disabled: false,
  rating: null,
};

export default VotingSlider;
