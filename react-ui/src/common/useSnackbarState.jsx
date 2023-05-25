/**
 * Setting Snackbar state (openTimestamp and type)
 */

import useComponentsState from './useComponentsState';

const useSnackbarState = () => {
  const updateState = useComponentsState()[1];

  const updateSnackbarState = (type) => {
    updateState({ snackbar: { openTimestamp: Date.now(), type } });
  };

  return updateSnackbarState;
};

export default useSnackbarState;
