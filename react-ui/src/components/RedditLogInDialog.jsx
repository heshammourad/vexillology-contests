import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { useRedditLogIn, useComponentsState } from '../common';

function RedditLogInDialog() {
  const sendUserToAuthUrl = useRedditLogIn();
  const [{ redditLogInDialogOpen }, setComponentsState] = useComponentsState();

  const closeDialog = () => {
    setComponentsState({ redditLogInDialogOpen: false });
  };

  const handleLogIn = () => {
    closeDialog();
    sendUserToAuthUrl();
  };

  return (
    <Dialog
      open={redditLogInDialogOpen}
      onClose={closeDialog}
      aria-labelledby="reddit-log-in-dialog-title"
      aria-describedby="reddit-log-in-dialog-description"
    >
      <DialogTitle id="reddit-log-in-dialog-title">Log in to Reddit?</DialogTitle>
      <DialogContent>
        <DialogContentText id="reddit-log-in-dialog-description">
          You must be logged in to Reddit to vote on contests
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>
        <Button onClick={handleLogIn} color="primary" variant="contained">
          Log In
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RedditLogInDialog;
