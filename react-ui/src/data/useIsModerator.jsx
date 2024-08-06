/**
 * Fetch contestId from url
 */

import useSwrInit from './useSwrInit';

const useIsModerator = () => {
  const {
    data: { moderator },
  } = useSwrInit();

  return moderator;
};

export default useIsModerator;
