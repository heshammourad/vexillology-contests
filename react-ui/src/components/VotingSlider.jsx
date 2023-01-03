import Button from '@material-ui/core/Button';
import Slider from '@material-ui/core/Slider';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useSWRMutation from 'swr/mutation';

import { deleteData, putData } from '../api';
import { useAuthState } from '../common';

const ACTIVE_COLOR = '#ff4500';
const INACTIVE_COLOR = '#707070';
const MIN_SCORE = 0;
const MAX_SCORE = 5;
const URL = '/votes';

const ThemedSlider = withStyles({
  root: {
    color: ACTIVE_COLOR,
    margin: '0 8px 16px',
  },
  active: {},
  mark: {
    color: ACTIVE_COLOR,
    height: 8,
    marginTop: -3,
    width: 2,
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor',
  },
  markLabel: {
    color: '#9e9e9e',
  },
  thumb: {
    color: ACTIVE_COLOR,
    '&:focus, &:hover, &$active': {
      boxShadow: '0px 0px 0px 8px rgba(255, 69, 0, 0.16)',
    },
  },
  valueLabel: {
    fontSize: '0.875rem',
    top: -22,
    '& *': {
      background: 'transparent',
      color: '#212121',
    },
  },
})(Slider);

const useStyles = makeStyles((theme) => ({
  clearVoteButton: {
    flexShrink: 0,
    marginBottom: 16,
    marginLeft: theme.spacing(1),
  },
  disabled: {
    color: INACTIVE_COLOR,
    '& .MuiSlider-mark': {
      color: INACTIVE_COLOR,
    },
    '& .MuiSlider-thumb': {
      color: INACTIVE_COLOR,
    },
    '& .MuiSlider-valueLabel': {
      color: INACTIVE_COLOR,
      left: -12,
    },
  },
  unrated: {
    color: INACTIVE_COLOR,
    '& .MuiSlider-mark': {
      color: INACTIVE_COLOR,
    },
    '& .MuiSlider-thumb': {
      visibility: 'hidden',
    },
  },
}));

const marks = [];
for (let i = 0; i <= MAX_SCORE; i += 1) {
  const mark = { value: i, label: `${i}` };
  marks.push(mark);
}

const updateEntries = (entries, { entryId, rating }) => entries.reduce((acc, cur) => {
  if (cur.imgurId !== entryId) {
    acc.push(cur);
  } else {
    acc.push({ ...cur, rating });
  }
  return acc;
}, []);

function VotingSlider({
  disabled, entryId, rating, setVotingComponentsState,
}) {
  const { contestId } = useParams();

  const [{ accessToken, isLoggedIn, refreshToken }] = useAuthState();
  const authTokens = { accessToken, refreshToken };

  const [isInteractive, setInteractive] = useState(false);
  const key = [`/contests/${contestId}`, authTokens];
  // eslint-disable-next-line max-len
  const { isMutating: isMutatingPut, trigger: triggerPut } = useSWRMutation(key, (_, { arg }) => putData(URL, arg, authTokens));
  const { isMutating: isMutatingDelete, trigger: triggerDelete } = useSWRMutation(
    key,
    (_, { arg }) => deleteData(URL, arg, authTokens),
  );

  const classes = useStyles();

  useEffect(() => {
    if (isInteractive) {
      setVotingComponentsState('votingDisabled', isMutatingDelete || isMutatingPut);
    }
  }, [isInteractive, isMutatingDelete, isMutatingPut]);

  const showError = () => {
    setVotingComponentsState('votingErrorSnackbarOpenTimestamp', Date.now());
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
      return { ...contest, entries: newEntries };
    },
    onError: () => {
      showError();
    },
  });

  const handleSliderChange = async (event, newValue) => {
    if (!isLoggedIn) {
      setVotingComponentsState('redditLogInDialogOpen', true);
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
        marks={marks}
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
  setVotingComponentsState: PropTypes.func.isRequired,
};

VotingSlider.defaultProps = {
  disabled: false,
  rating: null,
};

export default VotingSlider;
