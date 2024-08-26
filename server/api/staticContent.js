const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/STATIC_CONTENT');

/**
 * Get static content from Firebase.
 *
 * @param {Object} req - Express request
 * @param {Object} req.params - Parameters on request
 * @param {string} req.params.id - DB id of static content to fetch
 * @param {*} res - Express response
 */
exports.get = async ({ params: { id } }, res) => {
  try {
    const [result = {}] = await db.select(
      'SELECT content, markdown FROM static_content WHERE id = $1',
      [id],
    );
    const { content, markdown } = result;
    if (!content) {
      logger.info(`Static content with id='${id}' not found`);
      res.status(404).send();
    }

    res.send({ content, markdown });
  } catch (err) {
    logger.warn(`Error getting /${id}: ${err}`);
    res.status(500).send();
  }
};
