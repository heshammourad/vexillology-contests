const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/HALL_OF_FAME');

exports.get = async (req, res) => {
  try {
    const result = await db.select('SELECT * FROM hall_of_fame');

    const removedYearEndWinners = [];
    const response = result.reduce(
      (acc, {
        contestId, date, entryId, validRedditId, winnersThreadId, yearEnd, ...rest
      }) => {
        if (yearEnd && result.filter((entry) => entry.entryId === entryId).length > 1) {
          removedYearEndWinners.push(entryId);
          return acc;
        }

        let redditThreadId = winnersThreadId;
        if (!redditThreadId && validRedditId) {
          redditThreadId = contestId;
        }

        return [
          ...acc,
          {
            date: date.toJSON().substr(0, 7),
            entryId,
            imagePath: `/i/${entryId}.png`,
            redditThreadId,
            yearEndContest: yearEnd,
            yearEndWinner: yearEnd || removedYearEndWinners.includes(entryId),
            ...rest,
          },
        ];
      },
      [],
    );
    logger.debug(`Got '${JSON.stringify(response)}' for /hallOfFame`);
    res.send(response);
  } catch (err) {
    logger.error(`Error getting /hallOfFame: ${err}`);
    res.status(500).send();
  }
};
