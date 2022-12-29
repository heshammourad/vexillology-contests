import createPersistedState from 'use-persisted-state';

const usePersistedAuthState = createPersistedState('auth');

const useAuthState = () => usePersistedAuthState({});

export default useAuthState;
