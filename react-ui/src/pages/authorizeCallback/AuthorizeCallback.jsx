import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getData } from '../../api';
import { useAuthState } from '../../common';

const retrieveAccessTokens = async (code) => {
  const tokens = await getData(`/accessToken/${code}`);
  return tokens;
};

function AuthorizeCallback() {
  const [searchParams] = useSearchParams();
  const [{ nonce }, setAuthState] = useAuthState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const { code, error, state } = Object.fromEntries(searchParams);
    if (error) {
      // TODO: Handle error from redirect
      return;
    }

    try {
      const stateValues = JSON.parse(window.atob(state))[nonce];
      if (!stateValues) {
        // TODO: Handle auth state mismatch
        return;
      }

      if (!code) {
        // TODO: Handle missing code
        return;
      }

      retrieveAccessTokens(code).then((tokens) => {
        if (!tokens.accessToken || !tokens.refreshToken) {
          // TODO: Handle missing tokens
          return;
        }

        setAuthState({ ...tokens, isLoggedIn: true });

        const { redirectPath } = stateValues;
        if (!redirectPath) {
          // TODO: Handle missing redirectPath
          return;
        }

        navigate(redirectPath, { replace: true });
      });
    } catch (e) {
      // TODO: Handle error
    }
  }, []);

  return null;
}

export default AuthorizeCallback;
