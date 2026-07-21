const db = require('../db');
const { refreshContestsSummaryView } = require('../db/queries');
const { createLogger } = require('../logger');

const logger = createLogger('API/CONTEST_SUMMARY');

exports.put = async ({ body: { id, resultsCertified } }, res) => {
  logger.debug('Putting /manageContest');
  try {
    const [response] = await db.update(
      'contests',
      [
        {
          id,
          results_certified: resultsCertified,
        },
      ],
      ['?id', 'results_certified'],
      ['results_certified'],
    );
    if (!response) {
      res.status(404).send('Contest with that id not found');
      return;
    }
    if (resultsCertified) {
      // Refresh the materialized view in the background so we don't block the API response.
      // The void operator indicates that this promise is intentionally not awaited.
      void refreshContestsSummaryView().catch((err) => {
        logger.error(
          `Error background refreshing contests_summary view: ${
            err.message || err
          }`,
        );
      });
    }
    res.send(response);
  } catch (err) {
    logger.error(`Error putting /manageContest: ${err}`);
    res.status(500).send();
  }
};
