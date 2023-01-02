/* eslint-disable import/prefer-default-export */

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
