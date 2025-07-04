/**
 * User search API
 */

const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/USER_SEARCH');

exports.userBansSearch = async ({ query: { searchTerm } }, res) => {
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
        ub.created_date,
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
       ORDER BY u.username ASC, ub.created_date DESC
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

      // Add ban history if there's a ban record (actionId is not null)
      if (row.actionId) {
        groupedUsers[row.username].history.push({
          actionId: row.actionId,
          username: row.username,
          actionType: row.actionType,
          createdDate: new Date(row.createdDate),
          startDate: new Date(row.startDate),
          endDate: row.endDate === null ? null : new Date(row.endDate),
          reason: row.reason,
          contestId: row.contestId || '',
          moderator: row.moderator,
          lifted: row.lifted,
          liftedDate: row.liftedDate ? new Date(row.liftedDate) : null,
          liftedModerator: row.liftedModerator,
          liftedReason: row.liftedReason,
        });
      }
      // If actionId is null, the user has no bans but is still included with empty history
    });

    const users = Object.values(groupedUsers);

    res.send({ users });
  } catch (err) {
    logger.error(`Error searching users for "${searchTerm}": ${err}`);
    res.status(500).send({ error: 'Internal server error' });
  }
};

exports.getUsersBanHistories = async ({ query: { usernames } }, res) => {
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

    // Get ban history for the specified usernames
    const usersWithBans = await db.select(
      `SELECT 
        ub.username,
        ub.id as action_id,
        ub.type as action_type,
        ub.start_date,
        ub.end_date,
        ub.created_date,
        ub.reason,
        ub.contest_id,
        ub.moderator,
        ub.lifted,
        ub.lifted_date,
        ub.lifted_moderator,
        ub.lifted_reason
       FROM user_bans ub
       WHERE ub.username = ANY($1)
       ORDER BY ub.username ASC, ub.created_date DESC`,
      [usernameList],
    );

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
      // Add ban history if there's a ban record (actionId is not null)
      if (row.actionId) {
        groupedUsers[row.username].history.push({
          actionId: row.actionId,
          username: row.username,
          actionType: row.actionType,
          createdDate: new Date(row.createdDate),
          startDate: new Date(row.startDate),
          endDate: row.endDate === null ? null : new Date(row.endDate),
          reason: row.reason,
          contestId: row.contestId || '',
          moderator: row.moderator,
          lifted: row.lifted,
          liftedDate: row.liftedDate ? new Date(row.liftedDate) : null,
          liftedModerator: row.liftedModerator,
          liftedReason: row.liftedReason,
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

exports.saveUserBan = async ({ body, username: moderator }, res) => {
  try {
    const {
      username, contestId, actionType, editType, removalReason,
    } = body;
    const actionId = body.actionId ? parseInt(body.actionId, 10) : null;
    const startDate = new Date(body.startDate);
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const reason = body.reason?.trim();

    // Validate required fields
    if (!username || !actionType || !reason || !contestId || !startDate) {
      res.status(400).send({
        error:
          'Username, action type, reason, contest ID, and start date are required',
      });
      return;
    }

    if (!['ban', 'warn'].includes(actionType)) {
      res.status(400).send({ error: 'Action type must be "ban" or "warn"' });
      return;
    }

    if (!moderator) {
      res.status(401).send({ error: 'Moderator authentication required' });
      return;
    }

    // Handle pardon (delete the entire row)
    if (actionId && editType === 'pardon') {
      await db.del('user_bans', { id: actionId });
      res.send({ success: true, message: 'Ban/warning pardoned successfully' });
      return;
    }

    // Handle lift (update lifted fields)
    if (actionId && editType === 'lift') {
      if (!removalReason?.trim()) {
        res.status(400).send({
          error: 'Removal reason is required when lifting a ban/warning',
        });
        return;
      }

      const updateData = {
        id: actionId,
        lifted: true,
        lifted_date: new Date(),
        lifted_moderator: moderator,
        lifted_reason: removalReason.trim(),
      };

      await db.update(
        'user_bans',
        [updateData],
        ['?id', 'lifted', 'lifted_date', 'lifted_moderator', 'lifted_reason'],
        ['id'],
      );
      res.send({ success: true, message: 'Ban/warning lifted successfully' });
      return;
    }

    // Handle new ban/warning or edit
    const banData = {
      username,
      contest_id: contestId,
      type: actionType,
      start_date: startDate,
      end_date: endDate,
      reason,
      moderator,
      lifted: false,
      lifted_date: null,
      lifted_moderator: null,
      lifted_reason: null,
    };

    if (actionId) {
      // Update existing ban/warning
      banData.id = actionId;
      await db.update(
        'user_bans',
        [banData],
        [
          '?id',
          'username',
          'contest_id',
          'type',
          'start_date',
          'end_date',
          'reason',
          'moderator',
          'lifted',
          'lifted_date',
          'lifted_moderator',
          'lifted_reason',
        ],
        ['id'],
      );
      res.send({ success: true, message: 'Ban/warning updated successfully' });
    } else {
      // Insert new ban/warning (ID will be auto-generated)
      const result = await db.insert('user_bans', [banData], {
        returning: ['id'],
      });
      res.send({
        success: true,
        message: 'Ban/warning created successfully',
        actionId: result[0]?.id,
      });
    }
  } catch (err) {
    logger.error(`Error saving user ban: ${err}`);
    res.status(500).send({ error: 'Internal server error' });
  }
};

exports.getActiveBans = async (req, res) => {
  try {
    // Get complete ban history for all users with active bans
    const completeBanHistory = await db.select(
      `SELECT 
        ub.username,
        ub.id as action_id,
        ub.type as action_type,
        ub.start_date,
        ub.end_date,
        ub.created_date,
        ub.reason,
        ub.contest_id,
        ub.moderator,
        ub.lifted,
        ub.lifted_date,
        ub.lifted_moderator,
        ub.lifted_reason
       FROM user_bans ub
       WHERE ub.lifted = false
         AND ub.type = 'ban'
         AND (ub.end_date IS NULL OR ub.end_date > NOW())
       ORDER BY ub.username ASC, ub.created_date DESC`,
    );

    // Group users with their complete ban history
    const groupedUsers = {};

    // Add ban history for users that have it
    completeBanHistory.forEach((row) => {
      if (!groupedUsers[row.username]) {
        groupedUsers[row.username] = {
          username: row.username,
          history: [],
        };
      }

      // Add ban history if there's a ban record (actionId is not null)
      if (row.actionId) {
        groupedUsers[row.username].history.push({
          actionId: row.actionId,
          username: row.username,
          actionType: row.actionType,
          createdDate: new Date(row.createdDate),
          startDate: new Date(row.startDate),
          endDate: row.endDate === null ? null : new Date(row.endDate),
          reason: row.reason,
          contestId: row.contestId || '',
          moderator: row.moderator,
          lifted: row.lifted,
          liftedDate: row.liftedDate ? new Date(row.liftedDate) : null,
          liftedModerator: row.liftedModerator,
          liftedReason: row.liftedReason,
        });
      }
    });

    const users = Object.values(groupedUsers);

    res.send({ users });
  } catch (err) {
    logger.error(`Error getting active bans: ${err}`);
    res.status(500).send({ error: 'Internal server error' });
  }
};

exports.checkUserBanStatus = async (req, res) => {
  try {
    const { username } = req;

    if (!username) {
      res.status(401).send({ error: 'Authentication required' });
      return;
    }

    // Check for active bans for the requesting user
    const activeBans = await db.select(
      `SELECT 
        ub.id as action_id,
        ub.type as action_type,
        ub.end_date,
        ub.created_date,
        ub.reason,
       FROM user_bans ub
       WHERE ub.username = $1
         AND ub.lifted = false
         AND ub.type = 'ban'
         AND (ub.end_date IS NULL OR ub.end_date > NOW())
       ORDER BY ub.created_date DESC
       LIMIT 1`,
      [username],
    );

    if (activeBans.length === 0) {
      res.send({
        isBanned: false,
      });
      return;
    }

    // Transform the ban data to match the expected format
    const transformedBans = activeBans.map((ban) => ({
      actionId: ban.actionId,
      username: ban.username,
      actionType: ban.actionType,
      createdDate: new Date(ban.createdDate),
      startDate: new Date(ban.startDate),
      endDate: ban.endDate === null ? null : new Date(ban.endDate),
      reason: ban.reason,
      contestId: ban.contestId || '',
      moderator: ban.moderator,
      lifted: ban.lifted,
      liftedDate: ban.liftedDate ? new Date(ban.liftedDate) : null,
      liftedModerator: ban.liftedModerator,
      liftedReason: ban.liftedReason,
    }));

    res.send({
      isBanned: true,
      activeBan: transformedBans[0],
    });
  } catch (err) {
    logger.error(
      `Error checking user ban status for "${req.username}": ${err}`,
    );
    res.status(500).send({ error: 'Internal server error' });
  }
};

/**
 * Get the most recent ban/warning status for users active during a specific contest period
 *
 * This endpoint:
 * 1. Takes a contestId parameter
 * 2. Gets the contest date from the contests table
 * 3. Converts the contest date to the last day of that month
 * 4. Returns the most recent ban/warning status for each user active during that period
 *
 * A ban/warning is considered "active" if:
 * - start_date < contestDate (ban started before contest)
 * - end_date IS NULL OR end_date > contestDate (ban hasn't expired or doesn't expire)
 * - lifted = false OR lifted_date > contestDate (ban wasn't lifted or was lifted after contest)
 *
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.contestId - The contest ID to check bans for
 * @param {Object} res - Express response object
 */
exports.getContestBans = async ({ query: { contestId } }, res) => {
  try {
    if (!contestId) {
      res.status(400).send({ error: 'Contest ID is required' });
      return;
    }

    // Get the contest date from the contests table
    const contestResult = await db.select(
      'SELECT date FROM contests WHERE id = $1',
      [contestId],
    );

    if (contestResult.length === 0) {
      res.status(404).send({ error: 'Contest not found' });
      return;
    }

    const contestDate = contestResult[0].date;

    // Convert contest date to the last day of the month
    const lastDayOfMonth = new Date(
      contestDate.getFullYear(),
      contestDate.getMonth() + 1,
      0,
    );

    // Get the most recent ban/warning for each user active during the contest period
    const usersWithBans = await db.select(
      `SELECT DISTINCT ON (ub.username) 
        ub.username,
        ub.type as action_type
       FROM user_bans ub
       WHERE ub.start_date < $1
         AND (ub.end_date IS NULL OR ub.end_date > $1)
         AND (ub.lifted = false OR ub.lifted_date > $1)
       ORDER BY ub.username ASC, ub.created_date DESC`,
      [lastDayOfMonth],
    );

    // Convert to the desired format: {[username: string]: "warn" | "ban"}
    const userBanStatus = {};
    usersWithBans.forEach((row) => {
      userBanStatus[row.username] = row.actionType;
    });

    res.send({ userBanStatus });
  } catch (err) {
    logger.error(
      `Error getting contest bans for contest "${contestId}": ${err}`,
    );
    res.status(500).send({ error: 'Internal server error' });
  }
};
