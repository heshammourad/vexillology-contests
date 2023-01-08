import createPersistedState from 'use-persisted-state';

const usePersistedSettings = createPersistedState('votingComponents');

const DEFAULT_STATE = {
  accountMenuOpen: false,
  redditLogInDialogOpen: false,
  votingDisabled: false,
  votingErrorSnackbarOpenTimestamp: null,
};

const useComponentsState = () => {
  const [state, setState] = usePersistedSettings(DEFAULT_STATE);

  const updateState = (key, value) => {
    if (!key) {
      setState(DEFAULT_STATE);
      return;
    }

    setState({ ...state, [key]: value });
  };

  return [state, updateState];
};

export default useComponentsState;
