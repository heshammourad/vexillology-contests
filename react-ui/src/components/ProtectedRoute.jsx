/**
 * Checks permission before navigation (e.g. logged in, moderator)
 */

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import PropTypes from 'prop-types';

import { useAuthState, useRedditLogIn, useSwrData } from '../common';

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
  children, message, moderatorPath, showCancel,
}) {
  const { error } = useSwrData(moderatorPath);
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

  if (error?.response?.status === 403) {
    return (
      <PageContainer className={classes.container}>
        <Typography className={classes.message}>Must be a moderator to access page</Typography>
        {goHomeButton}
      </PageContainer>
    );
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  message: PropTypes.string,
  moderatorPath: PropTypes.string,
  showCancel: PropTypes.bool,
};

ProtectedRoute.defaultProps = {
  message: 'You must be logged in to view this page',
  moderatorPath: null,
  showCancel: true,
};

export default ProtectedRoute;
