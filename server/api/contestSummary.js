const { isFuture } = require('date-fns');

const db = require('../db');
const { getCurrentContest, getCategories } = require('../db/queries');
const { createLogger } = require('../logger');
const { generateImagePath } = require('../util');

const logger = createLogger('API/CONTEST_SUMMARY');

exports.get = async (req, res) => {
  logger.debug('Getting /contestSummary');
  try {
    const contest = await getCurrentContest();
    if (!contest) {
      res.status(404).send();
      return;
    }

    const { id, resultsCertified, voteEnd } = contest;
    const categories = await getCategories(id);

    const contestResults = await db.select(
      'SELECT * FROM get_contest_results()',
    );
    if (
      isFuture(voteEnd)
      && contestResults.some((result) => result.submitter === req.username)
    ) {
      res.status(200).send({ visibilityLimited: true, voteEnd });
      return;
    }
    const entries = contestResults.map((entry) => ({
      ...entry,
      imagePath: generateImagePath(entry.entryId),
    }));

    const response = {
      categories,
      entries,
      resultsCertified,
      voteEnd,
    };
    logger.debug(`Sending '${JSON.stringify(response)}' for /contestSummary`);
    res.status(200).send(response);
  } catch (err) {
    logger.error(`Error getting /contestSummary: ${err}`);
    res.status(500).send();
  }
};
