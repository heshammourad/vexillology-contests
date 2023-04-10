import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getData } from '../../api';
import { useAuthState, useRedditLogIn } from '../../common';
import { PageContainer } from '../../components';

const ACCESS_DENIED = 'access_denied';
const DATA_ERROR = 'data_error';

const useStyles = makeStyles({
  heading: {
    lineHeight: '64px',
  },
});

const retrieveAccessTokens = async (code) => {
  const tokens = await getData(`/accessToken/${code}`);
  return tokens;
};

function AuthorizeCallback() {
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState(null);
  const sendUserToAuthUrl = useRedditLogIn();
  const [{ nonce }, setAuthState] = useAuthState(0);
  const navigate = useNavigate();
  const classes = useStyles();

  const { code, error, state } = Object.fromEntries(searchParams);
  const getStateValues = () => {
    try {
      return JSON.parse(window.atob(state))[nonce];
    } catch (e) {
      return null;
    }
  };
  const stateValues = getStateValues();
  const { redirectPath = '/', ...scrollState } = stateValues || {};

  const redirect = (routerState) => {
    navigate(redirectPath, { replace: true, state: routerState });
  };

  const getErrorMessage = () => {
    switch (errorMessage) {
      case ACCESS_DENIED:
        return 'You must log in to your Reddit account to vote in contests. You may resume browsing, or try to log in again.';
      case DATA_ERROR:
        return 'An error occurred reading data from Reddit. Please try again or resume browsing the error is fixed.';
      default:
        return '';
    }
  };

  useEffect(() => {
    if (error) {
      if (error === ACCESS_DENIED) {
        setErrorMessage(ACCESS_DENIED);
      }
      return;
    }

    try {
      if (!stateValues || !code) {
        setErrorMessage(DATA_ERROR);
        return;
      }

      retrieveAccessTokens(code).then((tokens) => {
        if (!tokens.accessToken || !tokens.refreshToken) {
          setErrorMessage(DATA_ERROR);
          return;
        }

        setAuthState({ ...tokens, isLoggedIn: true });

        navigate(redirectPath, { replace: true, state: scrollState });
      });
    } catch (e) {
      setErrorMessage(DATA_ERROR);
    }
  }, []);

  return (
    errorMessage && (
      <PageContainer>
        <Typography className={classes.heading} variant="h6" component="h1">
          Sorry, something went wrong :(
        </Typography>
        <p>{getErrorMessage()}</p>
        <Button
          color="primary"
          onClick={() => {
            redirect();
          }}
        >
          Resume Browsing
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            sendUserToAuthUrl({ stateValues });
          }}
        >
          Try Again
        </Button>
      </PageContainer>
    )
  );
}

export default AuthorizeCallback;
