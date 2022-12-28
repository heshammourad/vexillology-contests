import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import { downvote, upvote } from '../utils/vote';

import useAuthState from './useAuthState';

const useVotes = () => {
  const [{ accessToken, isLoggedIn, refreshToken }] = useAuthState();
  const authTokensRef = useRef(null);

  useEffect(() => {
    let authTokens = null;
    if (isLoggedIn) {
      authTokens = { accessToken, refreshToken };
    }
    authTokensRef.current = authTokens;
  }, [isLoggedIn]);

  const { contestId } = useParams();
  const { data, mutate } = useSWR(
    authTokensRef.current ? [`/votes/${contestId}`, authTokensRef.current] : null,
    { revalidateOnMount: true },
  );

  const processResult = ({ id, likes }) => {
    const newData = [...data];
    newData.find((entry) => entry.id === id).likes = likes;
    // eslint-disable-next-line no-console
    console.log(id, likes, newData);
    mutate(newData);
  };

  const downvoteEntry = async (id, likes) => {
    const result = await downvote(id, likes, authTokensRef.current);
    if (result) {
      processResult(result);
    }
  };

  const upvoteEntry = async (id, likes) => {
    const result = await upvote(id, likes, authTokensRef.current);
    if (result) {
      processResult(result);
    }
    // TODO: Handle error
  };

  return {
    downvote: downvoteEntry,
    mutate,
    upvote: upvoteEntry,
    votes: data,
  };
};

export default useVotes;
