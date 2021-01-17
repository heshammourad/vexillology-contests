/* eslint-disable no-console */
const memjs = require('memjs');

const mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
  failover: true,
  timeout: 1,
  keepAlive: true,
  username: process.env.MEMCACHIER_USERNAME,
  password: process.env.MEMCACHIER_PASSWORD,
});

const get = async (key, callback, expires = 0) => {
  try {
    const { value } = await mc.get(key);
    if (value) {
      return JSON.parse(value);
    }
  } catch (err) {
    console.error(err);
  }

  const newValue = await callback();

  try {
    if (newValue) {
      mc.set(key, JSON.stringify(newValue), { expires });
    }
  } catch (err) {
    console.error(err);
  }

  return newValue;
};

module.exports = { get };
