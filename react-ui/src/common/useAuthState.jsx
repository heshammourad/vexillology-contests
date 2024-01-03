import createPersistedState from 'use-persisted-state';

const usePersistedAuthState = createPersistedState('auth');

const useAuthState = () => usePersistedAuthState({ authTokens: {} });

const useAuth = () => {
  const [authState, setAuthState] = useAuthState({});

  // Temp refactoring, to be replaced by force logout in the future
  const { accessToken, authTokens = {}, refreshToken } = authState;
  if (Object.keys(authTokens).length === 0 && accessToken && refreshToken) {
    try {
      setAuthState({ ...authState, authTokens: { accessToken, refreshToken } });
    } catch (e) {
      // setAuthState is throwing a null reference error, but still updating,
      // so wrapping in a try-catch. This should be fixed by replacing this library in #281.
    }
  }

  return [authState, setAuthState];
};

export default useAuth;
