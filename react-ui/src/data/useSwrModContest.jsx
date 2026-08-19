/**
 * Get a single contest's full details for the moderator edit form
 */

import useSwrAuth from './useSwrAuth';

const useSwrModContest = (id) => useSwrAuth(`/mod/contests/${id}`);

export default useSwrModContest;
