/**
 * User search API
 */

const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/USER_SEARCH');

exports.searchUsers = async ({ query: { searchTerm } }, res) => {
  try {
    if (!searchTerm) {
      res.status(400).send({ error: 'Search term is required' });
      return;
    }

    const users = await db.select(
      `SELECT username
       FROM users
       WHERE username ILIKE $1
       ORDER BY username ASC
       LIMIT 10`,
      [`${searchTerm}%`],
    );

    res.send({ users });
  } catch (err) {
    logger.error(`Error searching users for "${searchTerm}": ${err}`);
    res.status(500).send({ error: 'Internal server error' });
  }
};
