const axios = require('axios');
const Snoowrap = require('snoowrap');

const { createLogger } = require('./logger');

const logger = createLogger('REDDIT');

const {
  REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET,
  REDDIT_PASSWORD,
  WEB_APP_CLIENT_ID,
  WEB_APP_CLIENT_SECRET,
  WEB_APP_REDIRECT_URI,
} = process.env;

const redditApi = axios.create({
  baseURL: 'https://www.reddit.com/api/v1',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  auth: { username: WEB_APP_CLIENT_ID, password: WEB_APP_CLIENT_SECRET },
});

const grantType = 'authorization_code';
const userAgent = 'node:com.herokuapp.vexillology-contests:v0.1.0';

const snoowrap = new Snoowrap({
  userAgent,
  clientId: REDDIT_CLIENT_ID,
  clientSecret: REDDIT_CLIENT_SECRET,
  username: 'heshammourad',
  password: REDDIT_PASSWORD,
});

const getSnoowrap = (auth) => {
  if (!auth || !auth.accesstoken || !auth.refreshtoken) {
    return snoowrap;
  }
  return new Snoowrap({
    userAgent,
    clientId: WEB_APP_CLIENT_ID,
    clientSecret: WEB_APP_CLIENT_SECRET,
    refreshToken: auth.refreshtoken,
    accessToken: auth.accesstoken,
  });
};

const getContest = async (submissionId) => {
  logger.debug(`Getting contest submission: '${submissionId}`);
  const submission = await getSnoowrap().getSubmission(submissionId);
  const isContestMode = await submission.contest_mode;
  const entries = await submission.comments.reduce(
    (acc, {
      author, body, body_html: bodyHtml, id, permalink,
    }) => {
      if (author.name !== 'Vexy') {
        return acc;
      }

      const description = `<p>${bodyHtml.match(/<\/p>.*?<p>(.*)<\/p>/s)[1]}</p>`;
      const imgurId = body.match(/imgur\.com\/(\w*)(\.|\))/)[1];
      const name = body.match(/\*\*(.*?)\*\*/)[1];

      return [
        ...acc,
        {
          description,
          id,
          imgurId,
          name,
          permalink,
        },
      ];
    },
    [],
  );
  const contest = { entries, isContestMode };
  logger.debug(`Got contest: '${JSON.stringify(contest)}'`);
  return contest;
};

const getUser = async (auth) => {
  const { name } = await getSnoowrap(auth).getMe();
  return name;
};

const getVotes = async (submissionId, auth) => {
  logger.debug(`Getting contest votes: ${submissionId}`);

  const submission = await getSnoowrap(auth).getSubmission(submissionId);
  const votes = await submission.comments
    .filter(({ author }) => author.name === 'Vexy')
    .map(({ id, likes }) => ({ id, likes }));

  logger.debug(`Get contest votes: '${JSON.stringify(votes)}'`);
  return votes;
};

const getWinners = async (winnersThreadId) => {
  logger.debug(`Getting winners submission: '${winnersThreadId}'`);
  const submission = await getSnoowrap().getSubmission(winnersThreadId);
  const selftext = await submission.selftext;
  const winners = Array.from(
    selftext.matchAll(/(\d*)\|(.*)\|.*imgur\.com\/(\w*)(\.|\))/g),
    (match) => ({
      imgurId: match[3],
      rank: parseInt(match[1], 10),
      user: match[2],
    }),
  );
  logger.debug(`Got winners: '${JSON.stringify(winners)}'`);
  return winners;
};

const retrieveAccessToken = async (code) => {
  try {
    const { data } = await redditApi.post('/access_token', {
      grant_type: grantType,
      code,
      redirect_uri: WEB_APP_REDIRECT_URI,
    });
    logger.debug(`Retrieved access token: ${JSON.stringify(data)}`);
    return data;
  } catch (e) {
    logger.error(`Error retrieveAccessToken: ${e}`);
  }
  return null;
};

const revokeRefreshToken = async (token) => {
  await redditApi.post('/revoke_token', { token, token_type_hint: 'refresh_token' });
};

const getComment = async (commentId, auth) => {
  const comment = await getSnoowrap(auth).getComment(commentId);
  return comment;
};

const downvote = async (commentId, auth) => {
  (await getComment(commentId, auth)).downvote();
};

const unvote = async (commentId, auth) => {
  (await getComment(commentId, auth)).unvote();
};

const upvote = async (commentId, auth) => {
  (await getComment(commentId, auth)).upvote();
};

module.exports = {
  downvote,
  getContest,
  getUser,
  getVotes,
  getWinners,
  retrieveAccessToken,
  revokeRefreshToken,
  unvote,
  upvote,
};
