/**
 * Multi-instance, multi-tab/browser shared and persistent state
 * Tracking redditLogInDialogOpen, snackbar, and votingDisabled
 * @returns {object} [state, setState]
 */

import createPersistedState from 'use-persisted-state';

const usePersistedSettings = createPersistedState('votingComponents');

const DEFAULT_STATE = {
  redditLogInDialogOpen: false,
  snackbar: {},
  votingDisabled: false,
};

const useComponentsState = () => {
  const [state, setState] = usePersistedSettings(DEFAULT_STATE);

  const updateState = (newStates) => {
    if (!newStates) {
      setState(DEFAULT_STATE);
      return;
    }

    setState({ ...state, ...newStates });
  };

  return [state, updateState];
};

export default useComponentsState;
