/**
 * Get a single contest's full details for the moderator edit form. Fetches nothing without an id.
 */

import useSwrAuth from './useSwrAuth';

const useSwrModContest = (id) => useSwrAuth(id && `/mod/contests/${id}`);

export default useSwrModContest;
