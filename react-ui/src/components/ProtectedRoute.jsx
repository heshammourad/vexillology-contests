import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import { useAuthState, useRedditLogIn } from '../common';

import InternalLink from './InternalLink';

const useStyles = makeStyles({
  link: {
    '&:hover': {
      textDecoration: 'none',
    },
  },
  message: {
    marginBottom: 16,
  },
});

function ProtectedRoute({ children }) {
  const [{ isLoggedIn }] = useAuthState();
  const sendUserToAuthUrl = useRedditLogIn();

  const classes = useStyles();

  if (!isLoggedIn) {
    return (
      <>
        <Typography className={classes.message}>You must be signed in to view this page</Typography>
        <Button color="primary">
          <InternalLink className={classes.link} to="/home">
            Cancel
          </InternalLink>
        </Button>
        <Button color="primary" onClick={sendUserToAuthUrl}>
          Log In
        </Button>
      </>
    );
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
