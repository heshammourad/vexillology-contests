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

export const deleteData = async (path, data, authToken) => {
  try {
    await instance.delete(path, { ...generateConfig(authToken), data });
    return true;
  } catch (err) {
    return false;
  }
};

export const getData = async ([path, authToken]) => {
  try {
    const { data } = await instance.get(path, generateConfig(authToken));
    return data;
  } catch (err) {
    return null;
  }
};

export const putData = async (path, newData, authToken) => {
  try {
    const { data } = await instance.put(path, newData, generateConfig(authToken));
    return data;
  } catch (err) {
    return null;
  }
};
