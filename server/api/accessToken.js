/**
 * Fetch Reddit accessToken
 */

const { createLogger } = require('../logger');
const reddit = require('../reddit');
const { camelizeObjectKeys } = require('../util');

const logger = createLogger('API/ACCESS_TOKEN');

exports.get = async ({ params: { code } }, res) => {
  try {
    const result = await reddit.retrieveAccessToken(code);

    if (!result) {
      throw new Error('Unable to retrieve access token');
    }
    camelizeObjectKeys([result]);
    const { accessToken, refreshToken } = result;
    if (!accessToken || !refreshToken) {
      throw new Error('Missing auth tokens');
    }

    const username = await reddit.getUser(result);
    const response = { accessToken, refreshToken, username };
    res.send(response);
  } catch (err) {
    logger.error(`Error retrieving access token: ${err}`);
    res.status(500).send();
  }
};
