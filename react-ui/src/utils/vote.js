import { postData } from '../api';

const vote = async (dir, id, authTokens) => {
  const result = await postData('/vote', { dir, id }, authTokens);
  return result;
};

export const downvote = async (id, likes, authTokens) => {
  const dir = likes === false ? 0 : -1;
  const result = await vote(dir, id, authTokens);
  return result;
};

export const upvote = async (id, likes, authTokens) => {
  const dir = likes ? 0 : 1;
  const result = await vote(dir, id, authTokens);
  return result;
};
