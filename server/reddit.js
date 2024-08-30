/**
 * Access Reddit user and post data
 * @exports getContest @returns {entries, isContestMode}
 * @exports getUser
 * @exports getWinners
 * @exports isModerator
 * @exports retrieveAccessToken
 * @exports revokeRefreshToken
 */

const axios = require('axios');
const Snoowrap = require('snoowrap');

const { IS_UNAUTHENTICATED_VIEW } = require('./env');
const { createLogger } = require('./logger');

const logger = createLogger('REDDIT');

const {
  REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET,
  REDDIT_PASSWORD,
  REDDIT_USERNAME,
  WEB_APP_ACCESS_TOKEN,
  WEB_APP_CLIENT_ID,
  WEB_APP_CLIENT_SECRET,
  WEB_APP_REDIRECT_URI,
  WEB_APP_REFRESH_TOKEN,
} = process.env;

const redditApi = axios.create({
  baseURL: 'https://www.reddit.com/api/v1',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  auth: { username: WEB_APP_CLIENT_ID, password: WEB_APP_CLIENT_SECRET },
});

redditApi.interceptors.request.use((request) => {
  logger.debug(request);
  return request;
});
redditApi.interceptors.response.use((response) => {
  logger.debug(response);
  return response;
});

const userAgent = 'node:com.vexillologycontests:v0.1.0';

/**
 * @param {object} [auth] user auth
 * @returns auth ? user-populated snoowrap : default snoowrap
 */
const getSnoowrap = (auth = {}) => {
  const accessToken = auth.accessToken
    || auth.accesstoken
    || auth.access_token
    || WEB_APP_ACCESS_TOKEN;
  const refreshToken = auth.refreshToken
    || auth.refreshtoken
    || auth.refresh_token
    || WEB_APP_REFRESH_TOKEN;

  if (IS_UNAUTHENTICATED_VIEW || !accessToken || !refreshToken) {
    logger.debug('No auth tokens provided, returning default snoowrap');
    return new Snoowrap({
      userAgent,
      clientId: REDDIT_CLIENT_ID,
      clientSecret: REDDIT_CLIENT_SECRET,
      username: REDDIT_USERNAME,
      password: REDDIT_PASSWORD,
    });
  }

  return new Snoowrap({
    userAgent,
    clientId: WEB_APP_CLIENT_ID,
    clientSecret: WEB_APP_CLIENT_SECRET,
    refreshToken,
    accessToken,
  });
};

/**
 * Fetch contest from Reddit (or legacy reddit posts)
 * @param {*} submissionId unique ID of reddit post
 * @returns { entries:[], isContestMode }
 */
exports.getContest = async (submissionId) => {
  logger.debug(`Getting contest submission: '${submissionId}`);

  // getSubmission refers to a post, not a user submission
  const submission = await getSnoowrap().getSubmission(submissionId);
  const isContestMode = await submission.contest_mode;
  const entries = await submission.comments.reduce(
    (acc, {
      author, body, body_html: bodyHtml, id, permalink, removed,
    }) => {
      if (author.name !== 'Vexy' || removed) {
        return acc;
      }

      const description = `<p>${
        bodyHtml.match(/<\/p>.*?<p>(.*)<\/p>/s)[1]
      }</p>`;
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

/**
 * @param {object} auth {accessToken, refreshToken}
 * @returns name
 */
exports.getUser = async (auth) => {
  logger.debug('Getting username');
  const { name } = await getSnoowrap(auth).getMe();
  logger.debug(`Retrieved username: ${name}`);
  return name;
};

exports.getWinners = async (winnersThreadId) => {
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

exports.isModerator = async (user) => {
  logger.debug(`Checking if ${user} is moderator`);
  const moderators = await getSnoowrap()
    .getSubreddit('vexillology')
    .getModerators();

  const moderator = moderators.some(({ name }) => name === user);
  logger.debug(`${user} is moderator: ${moderator}`);
  return moderator;
};

exports.retrieveAccessToken = async (code) => {
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

exports.revokeRefreshToken = async (token) => {
  await redditApi.post('/revoke_token', {
    token,
    token_type_hint: 'refresh_token',
  });
};
