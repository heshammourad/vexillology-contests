/**
 * votingDisabled: currently mutating vote
 * votingExpired: outside voting window
 * votingUnavailable: votingDisabled || votingExpired
 */

import snackbarTypes from '../common/snackbarTypes';
import useAuthState from '../common/useAuthState';
import useComponentsState from '../common/useComponentsState';
import useIsTouchScreen from '../common/useIsTouchScreen';
import useSnackbarState from '../common/useSnackbarState';

import { deleteData, putData } from './api';
import useContestId from './useContestId';
import useSwrMutation from './useSwrMutation';
import useVotingStatus from './useVotingStatus';

const VOTES_URL = '/votes';

const updateEntries = (entries, { entryId, rating }) => entries.reduce((acc, cur) => {
  const id = cur.imgurId ?? cur.id;
  if (id !== entryId) {
    acc.push(cur);
  } else {
    acc.push({ ...cur, rating });
  }
  return acc;
}, []);

function useVoting(entryId) {
  const contestId = useContestId();
  const isTouchScreen = useIsTouchScreen();
  const contestUrl = `/contests/${contestId}`;
  const setComponentsState = useComponentsState()[1];
  const [{ isLoggedIn }] = useAuthState();
  const { disableVoting } = useVotingStatus();

  const { trigger: triggerPut } = useSwrMutation(
    contestUrl,
    putData,
    VOTES_URL,
  );
  const { trigger: triggerDelete } = useSwrMutation(
    contestUrl,
    deleteData,
    VOTES_URL,
  );

  const updateSnackbarState = useSnackbarState();
  const showError = () => {
    updateSnackbarState(snackbarTypes.VOTING_ERROR);
  };
  const triggerOptions = (input) => ({
    optimisticData: (current) => ({
      ...current,
      entries: updateEntries(current.entries, input),
    }),
    revalidate: false,
    populateCache: (response, contest) => {
      if (!response) {
        showError();
        return contest;
      }

      const newEntries = updateEntries(contest.entries, input);
      const newData = { ...contest, entries: newEntries };
      updateSnackbarState(snackbarTypes.VOTING_SUCCESS);
      return newData;
    },
    onError: () => {
      showError();
    },
  });

  const changeRating = (newValue, oldValue, isKeyed = false) => {
    if (!isLoggedIn) {
      setComponentsState({ redditLogInDialogOpen: true });
      return;
    }

    if (newValue === oldValue) {
      return;
    }

    disableVoting(true);

    const voteInput = {
      contestId,
      entryId,
      isDesktop: !isTouchScreen,
      isKeyed,
      rating: newValue,
    };
    triggerPut(voteInput, triggerOptions(voteInput));
  };

  const clearRating = () => {
    disableVoting(true);

    const input = { contestId, entryId };
    triggerDelete(input, triggerOptions(input));
  };

  return {
    changeRating,
    clearRating,
    triggerDelete,
    triggerPut,
  };
}

export default useVoting;
