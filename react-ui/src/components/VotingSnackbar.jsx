import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import { useEffect, useState } from 'react';

import { useComponentsState } from '../common';

function VotingSnackbar() {
  // eslint-disable-next-line max-len
  const [{ votingSnackbarOpenTimestamp, votingSnackbarSeverity }, setComponentsState] = useComponentsState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    if (votingSnackbarOpenTimestamp && votingSnackbarSeverity) {
      setOpen(true);
    }

    return () => {
      setOpen(false);
    };
  }, [votingSnackbarOpenTimestamp]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setComponentsState({ votingSnackbarOpenTimestamp: null });
  };

  const getMessage = () => {
    switch (votingSnackbarSeverity) {
      case 'error':
        return 'An error occurred. Please try again later.';
      case 'success':
        return 'Vote submitted!';
      default:
        return null;
    }
  };

  return (
    <Snackbar
      key={votingSnackbarOpenTimestamp}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      autoHideDuration={6000}
      onClose={handleClose}
      open={isOpen && votingSnackbarSeverity}
    >
      {votingSnackbarSeverity && (
        <Alert onClose={handleClose} severity={votingSnackbarSeverity}>
          {getMessage()}
        </Alert>
      )}
    </Snackbar>
  );
}

export default VotingSnackbar;
