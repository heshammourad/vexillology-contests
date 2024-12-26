/**
 * @exports processUser adds username and moderator status to request
 * @exports requireAuthentication confirm authentication
 * @exports requireModerator confirm moderator
 */

const db = require('../db');
const { createLogger } = require('../logger');
const reddit = require('../reddit');

const logger = createLogger('API/AUTHENTICATION');

const isModerator = async (username) => {
  const [{ moderator } = {}] = await db.select(
    'SELECT moderator FROM users WHERE username = $1',
    [username],
  );
  return !!moderator;
};

exports.processUser = (checkModerator) => async (req, res, next) => {
  const {
    headers: { accesstoken, refreshtoken },
  } = req;
  if (!accesstoken || !refreshtoken) {
    next();
    return;
  }

  try {
    const { username, ...userAttributes } = await reddit.getUser({
      accesstoken,
      refreshtoken,
    });
    Object.assign(req, { username, userAttributes });

    if (checkModerator) {
      const moderator = await isModerator(username);
      req.moderator = moderator;
    }
  } catch (e) {
    logger.warn(`Error retrieving username: ${e}`);
  }

  next();
};

const requireAuthentication = async (req, res, next) => {
  try {
    const {
      headers: { accesstoken, refreshtoken },
    } = req;
    if (!accesstoken || !refreshtoken) {
      res.status(401).send('Missing authentication headers.');
      return;
    }

    const { username } = await reddit.getUser({ accesstoken, refreshtoken });
    if (!username) {
      res.status(401).send('User not found.');
      return;
    }

    req.username = username;
    next();
  } catch (e) {
    logger.error(`Error validating authentication: ${e}`);
    next(e);
  }
};

exports.requireAuthentication = requireAuthentication;

exports.requireModerator = [
  requireAuthentication,
  async (req, res, next) => {
    try {
      const moderator = await isModerator(req.username);
      if (!moderator) {
        res.status(403).send('Must be moderator to access resource');
        next(true);
        return;
      }

      next();
    } catch (e) {
      logger.error(`Error validating moderator status: ${e}`);
      next(e);
    }
  },
];
