/* eslint-disable no-console */
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
  const [{ nonce }, setAuthState] = useAuthState();
  const navigate = useNavigate();

  useEffect(() => {
    const { code, error, state } = Object.fromEntries(searchParams);
    if (error) {
      // TODO: Handle error from redirect
      console.error('error', error);
      return;
    }

    try {
      const stateValues = JSON.parse(window.atob(state))[nonce];
      console.log(stateValues, nonce);
      if (!stateValues) {
        // TODO: Handle auth state mismatch
        console.error('Auth State does not match', state, nonce);
        return;
      }

      if (!code) {
        // TODO: Handle missing code
        console.error('Missing code', stateValues);
        return;
      }

      retrieveAccessTokens(code).then((tokens) => {
        setAuthState({ ...tokens, isLoggedIn: true });

        const { redirectPath } = stateValues;
        if (!redirectPath) {
          // TODO: Handle missing redirectPath
          console.error('Missing redirectPath', stateValues);
          return;
        }

        navigate(redirectPath, { replace: true });
      });
    } catch (e) {
      // TODO: Handle parse errors
      console.error('e', e, state, window.atob(state));
    }
  }, []);

  return null;
}

export default AuthorizeCallback;
