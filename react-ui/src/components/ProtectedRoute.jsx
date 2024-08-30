/**
 * Checks permission before navigation (e.g. logged in, moderator)
 */

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import useAuthState from '../common/useAuthState';
import useRedditLogIn from '../common/useRedditLogIn';

import InternalLink from './InternalLink';
import PageContainer from './PageContainer';

const useStyles = makeStyles((theme) => ({
  cancelButton: {
    marginRight: theme.spacing(2),
  },
  container: {
    marginTop: theme.spacing(2),
  },
  link: {
    '&:hover': {
      textDecoration: 'none',
    },
  },
  message: {
    marginBottom: 16,
  },
}));

function ProtectedRoute({
  children, message, errorStatus, showCancel,
}) {
  const [{ isLoggedIn }] = useAuthState();
  const sendUserToAuthUrl = useRedditLogIn();

  const classes = useStyles();

  const goHomeButton = (
    <Button className={classes.cancelButton} color="primary">
      <InternalLink className={classes.link} to="/home">
        Go Home
      </InternalLink>
    </Button>
  );

  if (!isLoggedIn) {
    return (
      <PageContainer className={classes.container}>
        <Typography className={classes.message}>{message}</Typography>
        {showCancel && goHomeButton}
        <Button color="primary" variant="contained" onClick={sendUserToAuthUrl}>
          Log In
        </Button>
      </PageContainer>
    );
  }

  if (errorStatus === 403) {
    return (
      <PageContainer className={classes.container}>
        <Typography className={classes.message}>
          Must be a moderator to access page
        </Typography>
        {goHomeButton}
      </PageContainer>
    );
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  message: PropTypes.string,
  errorStatus: PropTypes.number,
  showCancel: PropTypes.bool,
};

ProtectedRoute.defaultProps = {
  message: 'You must be logged in to view this page',
  errorStatus: undefined,
  showCancel: true,
};

export default ProtectedRoute;
