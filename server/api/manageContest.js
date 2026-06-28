const db = require('../db');
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
      db.any('REFRESH MATERIALIZED VIEW CONCURRENTLY contests_summary')
        .catch((err) => {
          logger.warn(
            `CONCURRENTLY refresh failed, falling back to standard refresh. Error: ${
              err.message || err
            }`,
          );
          return db.any('REFRESH MATERIALIZED VIEW contests_summary');
        })
        .catch((err) => {
          logger.error(
            `Error refreshing contests_summary view: ${err.message || err}`,
          );
        });
    }
    res.send(response);
  } catch (err) {
    logger.error(`Error putting /manageContest: ${err}`);
    res.status(500).send();
  }
};
