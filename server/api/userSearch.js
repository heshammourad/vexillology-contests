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

    const usersWithBans = await db.select(
      `SELECT 
        u.username,
        ub.id as action_id,
        ub.type as action_type,
        ub.start_date,
        ub.end_date,
        ub.reason,
        ub.contest_id,
        ub.moderator,
        ub.lifted,
        ub.lifted_date,
        ub.lifted_moderator,
        ub.lifted_reason
       FROM users u
       LEFT JOIN user_bans ub ON u.username = ub.username
       WHERE u.username ILIKE $1
       ORDER BY u.username ASC, ub.start_date DESC
       LIMIT 100`,
      [`${searchTerm}%`],
    );

    // Group users with their ban history
    const groupedUsers = {};
    usersWithBans.forEach((row) => {
      if (!groupedUsers[row.username]) {
        groupedUsers[row.username] = {
          username: row.username,
          history: [],
        };
      }

      // Add ban history if there's a ban record (action_id is not null)
      if (row.action_id) {
        groupedUsers[row.username].history.push({
          actionId: row.action_id,
          username: row.username,
          actionType: row.action_type,
          startDate: new Date(row.start_date),
          endDate: row.end_date === null ? null : new Date(row.end_date),
          reason: row.reason,
          contestId: row.contest_id || '',
          moderator: row.moderator,
          lifted: row.lifted,
          liftedDate: row.lifted_date ? new Date(row.lifted_date) : null,
          liftedModerator: row.lifted_moderator,
          liftedReason: row.lifted_reason,
        });
      }
      // If action_id is null, the user has no bans but is still included with empty history
    });

    const users = Object.values(groupedUsers);

    res.send({ users });
  } catch (err) {
    logger.error(`Error searching users for "${searchTerm}": ${err}`);
    res.status(500).send({ error: 'Internal server error' });
  }
};

exports.getUserBanHistory = async ({ query: { usernames } }, res) => {
  try {
    if (!usernames) {
      res.status(400).send({ error: 'Usernames parameter is required' });
      return;
    }

    const usernameList = usernames.split(',');

    if (usernameList.length === 0) {
      res.status(400).send({ error: 'At least one username is required' });
      return;
    }

    // Create placeholders for the IN clause
    const placeholders = usernameList
      .map((_, index) => `$${index + 1}`)
      .join(',');

    // First, get all the users to ensure they exist
    const existingUsers = await db.select(
      `SELECT username FROM users WHERE username IN (${placeholders})`,
      usernameList,
    );

    // Get ban history for existing users
    const usersWithBans = existingUsers.length > 0
      ? await db.select(
        `SELECT 
        u.username,
        ub.id as action_id,
        ub.type as action_type,
        ub.start_date,
        ub.end_date,
        ub.reason,
        ub.contest_id,
        ub.moderator,
        ub.lifted,
        ub.lifted_date,
        ub.lifted_moderator,
        ub.lifted_reason
       FROM users u
       LEFT JOIN user_bans ub ON u.username = ub.username
       WHERE u.username IN (${placeholders})
       ORDER BY u.username ASC, ub.start_date DESC`,
        existingUsers.map((u) => u.username),
      )
      : [];

    console.log('uwb: ', usersWithBans);

    // Group users with their ban history
    const groupedUsers = {};

    // Initialize all requested usernames with empty history
    usernameList.forEach((username) => {
      groupedUsers[username] = {
        username,
        history: [],
      };
    });

    // Add ban history for users that have it
    usersWithBans.forEach((row) => {
      // Add ban history if there's a ban record (action_id is not null)
      if (row.action_id) {
        groupedUsers[row.username].history.push({
          actionId: row.action_id,
          username: row.username,
          actionType: row.action_type,
          startDate: new Date(row.start_date),
          endDate: row.end_date === null ? null : new Date(row.end_date),
          reason: row.reason,
          contestId: row.contest_id || '',
          moderator: row.moderator,
          lifted: row.lifted,
          liftedDate: row.lifted_date ? new Date(row.lifted_date) : null,
          liftedModerator: row.lifted_moderator,
          liftedReason: row.lifted_reason,
        });
      }
    });

    const users = Object.values(groupedUsers);

    res.send({ users });
  } catch (err) {
    logger.error(
      `Error getting ban history for usernames "${usernames}": ${err}`,
    );
    res.status(500).send({ error: 'Internal server error' });
  }
};
