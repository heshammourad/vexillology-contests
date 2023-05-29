/**
 * Log out of Reddit
 */

const { createLogger } = require('../logger');
const reddit = require('../reddit');

const logger = createLogger('API/REVOKE_TOKEN');

exports.get = async ({ params: { refreshToken } }, res) => {
  try {
    if (!refreshToken) {
      logger.warn('Missing refresh token');
      res.status(400).send();
    }
    await reddit.revokeRefreshToken(refreshToken);
    res.status(204).send();
  } catch (e) {
    logger.error(`Error revoking token: ${e}`);
    res.status(500).send();
  }
};
