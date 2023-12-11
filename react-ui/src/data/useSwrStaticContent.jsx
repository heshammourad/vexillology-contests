import useSwrAuth from './useSwrAuth';

const useSwrStaticContent = (id) => useSwrAuth(`/staticContent/${id}`);

export default useSwrStaticContent;
