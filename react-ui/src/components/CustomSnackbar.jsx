import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import { useEffect, useState } from 'react';

import { useComponentsState } from '../common';
import snackbarTypes from '../common/snackbarTypes';

const TYPES = {
  [snackbarTypes.SETTINGS_ERROR]: {
    message: 'Error submitting setting. Please try again later.',
    severity: 'error',
  },
  [snackbarTypes.SETTINGS_SUCCESS]: {
    message: 'Setting saved',
    severity: 'success',
  },
  [snackbarTypes.VOTING_ERROR]: {
    message: 'Error submitting vote. Please try again later.',
    severity: 'error',
  },
  [snackbarTypes.VOTING_SUCCESS]: {
    message: 'Vote submitted!',
    severity: 'success',
  },
};

function CustomSnackbar() {
  // eslint-disable-next-line max-len
  const [{ snackbar: { openTimestamp, type } = { snackbar: {} } }, setComponentsState] = useComponentsState();
  const [isOpen, setOpen] = useState(false);

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

    setComponentsState({ snackbar: {} });
  };

  const typeToDisplay = TYPES[type];

  return (
    <Snackbar
      key={openTimestamp}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      autoHideDuration={6000}
      onClose={handleClose}
      open={isOpen && !!typeToDisplay}
    >
      {typeToDisplay ? (
        <Alert onClose={handleClose} severity={typeToDisplay.severity}>
          {typeToDisplay.message}
        </Alert>
      ) : null}
    </Snackbar>
  );
}

export default CustomSnackbar;
