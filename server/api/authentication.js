/**
 * @exports processUser ensure user is logged in
 * @exports requireAuthentication confirm authentication
 * @exports requireModerator confirm moderator
 */

const db = require('../db');
const { createLogger } = require('../logger');
const reddit = require('../reddit');

const logger = createLogger('API/AUTHENTICATION');

exports.processUser = (checkModerator) => async (req, res, next) => {
  const {
    headers: { accesstoken, refreshtoken },
  } = req;
  if (!accesstoken || !refreshtoken) {
    next();
    return;
  }

  const username = await reddit.getUser({ accesstoken, refreshtoken });
  req.username = username;

  if (checkModerator) {
    const moderator = await reddit.isModerator(username);
    req.moderator = moderator;
  }
  next();
};

exports.requireAuthentication = async (req, res, next) => {
  try {
    const {
      headers: { accesstoken, refreshtoken },
    } = req;
    if (!accesstoken || !refreshtoken) {
      res.status(401).send('Missing authentication headers.');
      next(true);
      return;
    }

    const username = await reddit.getUser({ accesstoken, refreshtoken });
    if (!username) {
      res.status(401).send('User not found.');
      next(true);
      return;
    }

    req.username = username;
    next();
  } catch (e) {
    logger.error(`Error validating authentication: ${e}`);
    next(e);
  }
};

exports.requireModerator = async (req, res, next) => {
  try {
    await this.requireAuthentication(req, res, () => { });

    const [{ moderator } = {}] = await db.select(
      'SELECT moderator FROM users WHERE username = $1',
      [req.username],
    );
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
};
