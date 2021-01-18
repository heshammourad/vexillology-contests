const axios = require('axios');

const getImagesData = async (images) => images.map(async ({ id }) => {
  const {
    data: { width, height },
  } = await axios.get(`https://api.imgur.com/3/image/${id}`, {
    Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
  });
  return { ...images, width, height };
});

module.exports = { getImagesData };
