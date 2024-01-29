import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import useComponentsState from '../common/useComponentsState';
import useRedditLogIn from '../common/useRedditLogIn';

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
