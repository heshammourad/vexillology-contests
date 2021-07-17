const axios = require('axios');

const getImagesData = async (images) => {
  const enhancedImages = Promise.all(
    images.map(async (image) => {
      try {
        const {
          data: {
            data: { width, height },
          },
        } = await axios.get(`https://api.imgur.com/3/image/${image.imgurId}`, {
          headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}` },
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
