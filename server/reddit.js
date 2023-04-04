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
redditApi.interceptors.request.use((request) => {
  logger.debug(request);
});
redditApi.interceptors.response.use((response) => {
  logger.debug(response);
});

const userAgent = 'node:com.herokuapp.vexillology-contests:v0.1.0';

const snoowrap = new Snoowrap({
  userAgent,
  clientId: REDDIT_CLIENT_ID,
  clientSecret: REDDIT_CLIENT_SECRET,
  username: 'heshammourad',
  password: REDDIT_PASSWORD,
});

const getSnoowrap = (auth = {}) => {
  const accessToken = auth.accessToken || auth.accesstoken || auth.access_token;
  const refreshToken = auth.refreshToken || auth.refreshtoken || auth.refresh_token;
  if (!accessToken || !refreshToken) {
    logger.debug('No auth tokens provided, returning default snoowrap');
    return snoowrap;
  }

  return new Snoowrap({
    userAgent,
    clientId: WEB_APP_CLIENT_ID,
    clientSecret: WEB_APP_CLIENT_SECRET,
    refreshToken,
    accessToken,
  });
};

const getContest = async (submissionId) => {
  logger.debug(`Getting contest submission: '${submissionId}`);
  const submission = await getSnoowrap().getSubmission(submissionId);
  const isContestMode = await submission.contest_mode;
  const entries = await submission.comments.reduce(
    (acc, {
      author, body, body_html: bodyHtml, id, permalink, removed,
    }) => {
      if (author.name !== 'Vexy' || removed) {
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
  logger.debug('Getting username');
  const { name } = await getSnoowrap(auth).getMe();
  logger.debug(`Retrieved username: ${name}`);
  return name;
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
      grant_type: 'authorization_code',
      code,
      redirect_uri: WEB_APP_REDIRECT_URI,
    });
    logger.debug('Successfully retrieved access token');
    return data;
  } catch (e) {
    logger.error(`Error retrieving access token: ${e}`);
  }
  return null;
};

const revokeRefreshToken = async (token) => {
  await redditApi.post('/revoke_token', { token, token_type_hint: 'refresh_token' });
};

module.exports = {
  getContest,
  getUser,
  getWinners,
  retrieveAccessToken,
  revokeRefreshToken,
};
