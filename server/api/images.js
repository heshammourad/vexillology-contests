/**
 * Get image URL from cache, database, or firebase
 * Then fetch the image
 */

const axios = require('axios');

const cache = require('../cache');
const db = require('../db');
const { getDownloadUrl } = require('../firebase');
const { createLogger } = require('../logger');

const logger = createLogger('API/IMAGES');

exports.get = async ({ params: { image } }, res) => {
  try {
    const downloadUrl = await cache.get(
      image,
      async () => {
        const [id] = image.match(/([^.]*)/);
        let [{ url } = {}] = await db.select(
          'SELECT url FROM entries WHERE id = $1',
          [id],
        );
        if (url) {
          return url;
        }

        url = await getDownloadUrl(image);
        return url;
      },
      30 * 24 * 60 * 60, // 30 days -> seconds
    );
    if (!downloadUrl) {
      res.status(404).send();
      return;
    }

    const { data } = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
    });
    res.contentType(downloadUrl.includes('png') ? 'image/png' : 'image/jpeg');
    // An image ID never points to different contents: uploads get a new random
    // name and entries.url isn't updated, so browsers needn't re-request it
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(data, 'binary'));
  } catch (err) {
    logger.warn(`Error getting /i/${image}: ${err}`);
    res.status(500).send();
  }
};
