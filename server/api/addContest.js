const { addContest } = require('../db/queries');
const { createLogger } = require('../logger');

const logger = createLogger('API/ADD_CONTEST');

exports.post = async ({ body }, res) => {
  logger.debug(`Posting /addContest with body: ${JSON.stringify(body)}`);
  const {
    categories,
    date,
    id,
    name,
    prompt,
    submissionEnd,
    submissionStart,
    voteEnd,
    voteStart,
    yearEnd,
  } = body;

  try {
    await addContest({
      categories,
      date,
      id,
      name,
      prompt,
      submissionEnd,
      submissionStart,
      voteEnd,
      voteStart,
      yearEnd,
    });
    logger.info(`Successfully added contest '${name}' (${date})`);
    res.status(201).send({ message: 'Contest created successfully' });
  } catch (err) {
    logger.error(`Error posting /addContest: ${err.message || err}`);
    res.status(500).send(err.message || 'Failed to create contest');
  }
};
