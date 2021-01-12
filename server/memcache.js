const memjs = require('memjs');

const mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
  failover: true,
  timeout: 1,
  keepAlive: true,
  username: process.env.MEMCACHIER_USERNAME,
  password: process.env.MEMCACHIER_PASSWORD,
});

const get = async (key, callback, expires = 0) => {
  const { value } = await mc.get(key);
  if (value) {
    return JSON.parse(value);
  }

  const newValue = await callback();
  if (newValue) {
    mc.set(key, JSON.stringify(newValue), { expires });
  }
  return newValue;
};

module.exports = { get };
