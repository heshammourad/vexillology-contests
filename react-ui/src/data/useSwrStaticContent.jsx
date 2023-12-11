import useSwrAuth from './useSwrAuth';

const useSwrContest = (id) => useSwrAuth(`/staticContent/${id}`);

export default useSwrContest;
