import createPersistedState from 'use-persisted-state';

const usePersistedAuthState = createPersistedState('auth');

const useAuthState = () => usePersistedAuthState({ authTokens: {} });

const useAuth = () => {
    const [authState, setAuthState] = useAuthState();

    // Temp refactoring, to be replaced by force logout in the future
    const { accessToken, authTokens, refreshToken } = authState;
    if (Object.keys(authTokens).length === 0 && accessToken && refreshToken) {
        setAuthState({ ...authState, authTokens: { accessToken, refreshToken } });
    }

    return [authState, setAuthState];
};

export default useAuth;
