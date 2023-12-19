/**
 * votingDisabled: currently mutating vote
 * votingExpired: outside voting window
 * votingUnavailable: votingDisabled || votingExpired
 */

import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';
import isFuture from 'date-fns/isFuture';
import { useEffect, useState } from 'react';

import { useComponentsState } from '../common';

import useSwrContest from './useSwrContest';

// Max allowable value for setTimeout, should realistically only apply to demo contest
const MAX_DELAY = 2147483647;

function useVotingStatus() {
  const [{ votingDisabled }, setComponentsState] = useComponentsState();
  const [votingExpired, setVotingExpired] = useState(false);

  const {
    data: {
      voteEnd,
    },
    mutate,
  } = useSwrContest();

  const voteEndDate = new Date(voteEnd);

  useEffect(() => {
    if (isFuture(voteEndDate)) {
      const timeToEnd = Math.min(differenceInMilliseconds(voteEndDate, new Date()), MAX_DELAY);
      const timeout = setTimeout(() => {
        mutate();
        setVotingExpired(true);
      }, timeToEnd);
      return () => clearTimeout(timeout);
    }

    setVotingExpired(true);
    return () => { };
  }, [voteEndDate]);

  const votingUnavailable = votingDisabled || votingExpired;
  const disableVoting = (isDisabled) => {
    setComponentsState({ votingDisabled: isDisabled });
  };

  return {
    voteEndDate,
    votingDisabled,
    votingUnavailable,
    disableVoting,
  };
}

export default useVotingStatus;
