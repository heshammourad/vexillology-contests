import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import useAuthState from './useAuthState';

const useVotes = () => {
  const [{ accessToken, isLoggedIn, refreshToken }] = useAuthState();
  const { contestId } = useParams();
  const { data, mutate } = useSWR(
    isLoggedIn ? [`/votes/${contestId}`, { accessToken, refreshToken }] : null,
  );

  return { mutate, votes: data };
};

export default useVotes;
