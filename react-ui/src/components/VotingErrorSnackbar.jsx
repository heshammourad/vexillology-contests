import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import { useEffect, useState } from 'react';

import { useVotingComponentsState } from '../common';

function VotingErrorSnackbar() {
  // eslint-disable-next-line max-len
  const [{ votingErrorSnackbarOpenTimestamp }, setVotingComponentsState] = useVotingComponentsState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    if (votingErrorSnackbarOpenTimestamp) {
      setOpen(true);
    }

    return () => {
      setOpen(false);
    };
  }, [votingErrorSnackbarOpenTimestamp]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setVotingComponentsState('votingErrorSnackbarOpenTimestamp', null);
  };

  return (
    <Snackbar
      key={votingErrorSnackbarOpenTimestamp}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      autoHideDuration={6000}
      onClose={handleClose}
      open={isOpen}
    >
      <Alert onClose={handleClose} severity="error">
        An error occurred. Please try again later.
      </Alert>
    </Snackbar>
  );
}

export default VotingErrorSnackbar;
