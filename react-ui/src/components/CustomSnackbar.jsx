/**
 * Provide notifications
 * @returns {object} Snackbar component
 * see https://mui.com/material-ui/react-snackbar/
 */

import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import { useEffect, useState } from 'react';

import snackbarTypes from '../common/snackbarTypes';
import useComponentsState from '../common/useComponentsState';

const TYPES = {
  [snackbarTypes.REVIEW_SUBMISSION_ERROR]:
    'Error updating submission. Please try again later.',
  [snackbarTypes.REVIEW_SUBMISSION_SUCCESS]: 'Submission updated',
  [snackbarTypes.SETTINGS_ERROR]:
    'Error submitting setting. Please try again later.',
  [snackbarTypes.SETTINGS_SUCCESS]: 'Setting saved',
  [snackbarTypes.SUBMISSION_ERROR]:
    'Error submitting entry. Please try again later.',
  [snackbarTypes.SUBMISSION_SUCCESS]: 'Entry submitted successfully!',
  [snackbarTypes.VOTING_ERROR]:
    'Error submitting vote. Please try again later.',
  [snackbarTypes.VOTING_SUCCESS]: 'Vote submitted!',
};

function CustomSnackbar() {
  const [
    { snackbar: { openTimestamp, type } = { snackbar: {} } },
    setComponentsState,
  ] = useComponentsState();
  const [isOpen, setOpen] = useState(false);

  const resetSnackbar = () => {
    setComponentsState({ snackbar: {} });
  };

  useEffect(
    () => () => {
      resetSnackbar();
    },
    [],
  );

  useEffect(() => {
    if (openTimestamp && type) {
      setOpen(true);
    }

    return () => {
      setOpen(false);
    };
  }, [openTimestamp]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    resetSnackbar();
  };

  const message = TYPES[type];

  return (
    <Snackbar
      key={openTimestamp}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      autoHideDuration={6000}
      onClose={handleClose}
      open={isOpen && !!message}
    >
      {message ? (
        <Alert
          onClose={handleClose}
          severity={type.split('_').pop().toLowerCase()}
        >
          {message}
        </Alert>
      ) : null}
    </Snackbar>
  );
}

export default CustomSnackbar;
