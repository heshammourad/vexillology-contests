/**
 * Call Reddit Authorize API
 */

import { nanoid } from 'nanoid';
import { useLocation } from 'react-router-dom';

import useAuthState from './useAuthState';
import useSwrData from './useSwrData';

const useRedditLogIn = () => {
  const { pathname } = useLocation();
  const setAuthState = useAuthState()[1];
  const {
    data: { webAppClientId },
  } = useSwrData('/init');

  const sendUserToAuthUrl = ({ stateValues = {} } = {}) => {
    const nonce = nanoid();
    setAuthState({ nonce });

    const { innerWidth, scrollY } = window;

    const state = window.btoa(
      JSON.stringify({
        [nonce]: {
          innerWidth,
          redirectPath: pathname,
          scrollY,
          ...stateValues,
        },
      }),
    );
    let url = 'https://www.reddit.com/api/v1/authorize';
    url += `?client_id=${webAppClientId}`;
    url += '&response_type=code';
    url += `&state=${state}`;
    url += `&redirect_uri=${window.location.origin}/authorizeCallback`;
    url += '&duration=permanent';
    url += '&scope=identity';

    window.location = url;
  };

  return sendUserToAuthUrl;
};

export default useRedditLogIn;
