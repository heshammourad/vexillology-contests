/* eslint-disable import/prefer-default-export */

import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',
});

export const getData = async (path, authToken) => {
  try {
    const config = {};
    if (authToken) {
      config.headers = { ...authToken };
    }
    const { data } = await instance.get(path, config);
    return data;
  } catch (err) {
    return null;
  }
};
