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
    res.send(response);
  } catch (err) {
    logger.error(`Error putting /manageContest: ${err}`);
    res.status(500).send();
  }
};
