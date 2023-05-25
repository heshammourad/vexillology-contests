/**
 * Manually store scroll status
 * @return {object} [state, setState]
 */

import createPersistedState from 'use-persisted-state';

const usePersistedScrollState = createPersistedState('scroll');

const useScrollState = () => usePersistedScrollState({});

export default useScrollState;
