import useSWRMutation from 'swr/mutation';

import useAuthState from './useAuthState';

/**
 * This callback type is called `apiFunction` and is displayed as a global symbol.
 *
 * @callback apiFunction
 * @param {string} path - Path of the API to call.
 * @param {*} arg - Arguments to pass to the call.
 * @param {Object} authTokens - Reddit user auth tokens.
 */

/**
 * React hook used for updating data on the server and mutating the local SWR data.
 * @see {@link https://swr.vercel.app/docs/mutation#useswrmutation|useSWRMutation}
 *
 * @param {string} path - Path of the API to call.
 * @param {apiFunction} apiFunction - Function to call API with, e.g. post/put.
 * @returns {*} data - data for the given key returned from `fetcher`
 * @returns {*} error - error thrown by `fetcher` (or undefined)
 * @returns {*} trigger(arg, options) - a function to trigger a remote mutation
 * @returns {*} reset - a function to reset the state (`data`, `error`, `isMutating`)
 * @returns {*} isMutating - if there's an ongoing mutation
 */
const useSwrMutation = (path, apiFunction) => {
  const [{ accessToken, refreshToken }] = useAuthState();
  const authTokens = { accessToken, refreshToken };

  // eslint-disable-next-line max-len
  const response = useSWRMutation([path, authTokens], (_, { arg }) => apiFunction(path, arg, authTokens));

  return { ...response, data: response.data || {} };
};

export default useSwrMutation;
