import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import { useRedditLogIn, useVotingComponentsState } from '../common';

function RedditLogInDialog() {
  const sendUserToAuthUrl = useRedditLogIn();
  const [{ redditLogInDialogOpen }, setVotingComponentsState] = useVotingComponentsState();

  const closeDialog = () => {
    setVotingComponentsState('redditLogInDialogOpen', false);
  };

  const handleLogIn = () => {
    closeDialog();
    sendUserToAuthUrl();
  };

  return (
    <Dialog
      open={redditLogInDialogOpen}
      onClose={closeDialog}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <DialogTitle id="dialog-title">Log in to Reddit?</DialogTitle>
      <DialogContent>
        <DialogContentText id="dialog-description">
          You need to be logged in to Reddit to vote on contests.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>
        <Button onClick={handleLogIn} color="primary" autoFocus>
          Log In
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RedditLogInDialog;
