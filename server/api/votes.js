const { isAfter, isBefore } = require('date-fns');

const db = require('../db');
const { getVoteDates } = require('../db/queries');
const { createLogger } = require('../logger');
const { camelizeObjectKeys } = require('../util');

const logger = createLogger('API/VOTES');

exports.all = async ({ body: { contestId } }, res, next) => {
  try {
    if (contestId) {
      logger.debug(`Vote change on ${contestId}`);
      const voteDates = await getVoteDates(contestId);

      if (!voteDates || !voteDates.length) {
        const message = 'contestId not found';
        logger.warn(`${message}: ${contestId}`);
        res.status(400).send(message);
        return;
      }

      const [{
        localVoting, now, voteStart, voteEnd,
      }] = voteDates;
      if (!localVoting) {
        const message = 'Contest does not allow local voting';
        logger.warn(`${message}: ${contestId}`);
        res.status(400).send(message);
        return;
      }

      if (!voteStart || !voteEnd) {
        const message = 'Unable to find voting dates for contest';
        logger.error(`${message}: ${contestId}`);
        res.status(400).send(message);
        return;
      }

      if (isBefore(now, voteStart)) {
        logger.warn('Vote submitted before voting window opened');
        res.status(400).send(`Voting window doesn't open until ${voteStart}`);
        return;
      }

      if (isAfter(now, voteEnd)) {
        logger.warn('Vote submitted after voting window closed');
        res.status(400).send(`Voting window closed at ${voteEnd}`);
        return;
      }
    }
    next();
  } catch (err) {
    logger.error(`Error validating /vote request: ${err}`);
    res.status(500).send();
  }
};

exports.put = async (
  {
    body: {
      contestId, entryId, isDesktop, isKeyed, rating,
    }, username,
  },
  res,
) => {
  try {
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      res
        .status(400)
        .send('Expected rating to be an integer between 0 and 5 inclusive.');
      return;
    }

    const voteData = {
      contest_id: contestId,
      entry_id: entryId,
      is_desktop: isDesktop,
      is_keyed: isKeyed,
      rating,
      username,
    };

    const currentValue = await db.select(
      'SELECT * FROM votes WHERE contest_id = $1 AND entry_id = $2 AND username = $3',
      [contestId, entryId, username],
    );
    let status;
    if (!currentValue.length) {
      await db.insert('votes', [voteData]);
      status = 201;
    } else {
      await db.update(
        'votes',
        [voteData],
        [
          '?contest_id',
          '?entry_id',
          '?username',
          'rating',
          'is_desktop',
          'is_keyed',
        ],
      );
      status = 200;
    }
    camelizeObjectKeys([voteData]);
    res.status(status).send(voteData);
  } catch (err) {
    logger.error(`Error putting /vote: ${err}`);
    res.status(500).send();
  }
};

exports.delete = async ({ body: { contestId, entryId }, username }, res) => {
  try {
    const voteData = { contest_id: contestId, entry_id: entryId, username };
    await db.del('votes', voteData);
    res.status(204).send();
  } catch (err) {
    logger.error(`Error deleting /vote: ${err}`);
    res.status(500).send();
  }
};
