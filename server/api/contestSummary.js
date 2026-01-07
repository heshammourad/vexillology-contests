const { isFuture } = require('date-fns');

const db = require('../db');
const { getCategories } = require('../db/queries');
const { createLogger } = require('../logger');
const { generateImagePath } = require('../util');

const logger = createLogger('API/CONTEST_SUMMARY');

exports.get = async (req, res) => {
  logger.debug('Getting /contestSummary');
  try {
    const contest = await db.select(
      `
      SELECT id, results_certified, vote_end
      FROM contests
      WHERE vote_start < now()
      ORDER BY vote_start DESC
      LIMIT 1`,
      undefined,
      true,
    );
    if (!contest) {
      res.status(404).send();
      return;
    }

    const { id, resultsCertified, voteEnd } = contest;
    const categories = await getCategories(id);

    const contestResults = await db.select(
      'SELECT * FROM get_contest_results($1)',
      [id],
    );
    if (!contestResults) {
      res.status(404).send();
      return;
    }
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
    const hasCategories = categories.length > 0;
    const resultsToInclude = entries.filter(
      (e) => e.rank <= 20 || e.categoryRank === 1,
    );

    const header = hasCategories
      ? '|Rank|Username|Submission|Score|Category\n|-:|-|-|-:-'
      : '|Rank|Username|Submission|Score\n|-:|-|-|-:';

    const rows = resultsToInclude.map((entry) => {
      const username = `/u/${entry.submitter}`;
      const submission = `[${entry.entryName}](https://www.vexillologycontests.com${entry.imagePath})`;

      let row = `${entry.rank}|${username}|${submission}|${entry.average}`;
      if (hasCategories) {
        row += '|';
        if (entry.categoryRank === 1) {
          row += entry.category;
        }
      }

      return row;
    });
    const resultsMarkdown = [header, ...rows].join('\n');

    const response = {
      categories,
      contestId: id,
      entries,
      resultsCertified,
      resultsMarkdown,
      voteEnd,
    };
    logger.debug(`Sending '${JSON.stringify(response)}' for /contestSummary`);
    res.status(200).send(response);
  } catch (err) {
    logger.error(`Error getting /contestSummary: ${err}`);
    res.status(500).send();
  }
};
