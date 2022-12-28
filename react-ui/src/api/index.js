import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',
});

const generateConfig = (authToken) => {
  const config = {};
  if (authToken) {
    config.headers = { ...authToken };
  }
  return config;
};

export const getData = async (path, authToken) => {
  try {
    const { data } = await instance.get(path, generateConfig(authToken));
    return data;
  } catch (err) {
    return null;
  }
};

export const postData = async (path, body, authToken) => {
  try {
    const { data } = await instance.post(path, body, generateConfig(authToken));
    return data;
  } catch (err) {
    return null;
  }
};
