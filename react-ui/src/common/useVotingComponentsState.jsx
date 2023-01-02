import createPersistedState from 'use-persisted-state';

const usePersistedSettings = createPersistedState('votingComponents');

const useVotingComponentsState = () => {
  const [state, setState] = usePersistedSettings({
    redditLogInDialogOpen: false,
    votingDisabled: false,
    votingErrorSnackbarOpenTimestamp: null,
  });

  const updateState = (key, value) => {
    setState({ ...state, [key]: value });
  };

  return [state, updateState];
};

export default useVotingComponentsState;
