const { v4: uuidv4 } = require('uuid');

const { createLogger } = require('../../logger');

const db = require('./db');
const reddit = require('./reddit');

const logger = createLogger('API/CONTEST');

exports.get = async ({ params: { contestId }, username }, res) => {
  try {
    const [contest] = await db.getContest(contestId);
    if (!contest) {
      logger.warn(`Contest id: ${contestId} not found in database.`);
      res.status(404).send();
      return;
    }

    const {
      date,
      localVoting,
      name,
      prompt,
      submissionEnd,
      submissionStart,
      subtext,
      validRedditId,
      winnersThreadId,
    } = contest;

    let response = {
      date: date.toJSON().substr(0, 10),
      isContestMode: false,
      localVoting,
      name,
      prompt,
      requestId: uuidv4(),
      submissionEnd,
      submissionStart,
      subtext,
      validRedditId,
      winnersThreadId,
    };

    // Check if this is a reddit contest, i.e. legacy contest
    if (validRedditId) {
      const redditContest = await reddit.getContest(contestId, winnersThreadId);
      if (!redditContest.entries.length) {
        logger.warn(`Unable to retrieve entries for contest: '${contestId}'`);
        res.status(404).send();
        return;
      }

      response = { ...response, ...redditContest };
      res.send(response);
      return;
    }

    res.send(response);
  } catch (err) {
    logger.error(`Error getting /contest/${contestId}: ${err}`);
    res.status(500).send();
  }
};
