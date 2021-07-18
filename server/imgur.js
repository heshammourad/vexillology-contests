const axios = require('axios');

const { IMGUR_CLIENT_ID, RAPIDAPI_KEY } = process.env;

const getImagesData = async (images) => {
  const enhancedImages = Promise.all(
    images.map(async (image) => {
      try {
        const {
          data: {
            data: { width, height },
          },
        } = await axios.get(`https://imgur-apiv3.p.rapidapi.com/3/image/${image.imgurId}`, {
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
            'x-rapidapi-key': RAPIDAPI_KEY,
          },
        });
        return {
          ...image,
          width,
          height,
        };
      } catch (e) {
        return null;
      }
    }),
  );
  return (await enhancedImages).filter((image) => image);
};

module.exports = { getImagesData };
