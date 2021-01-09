/* eslint-disable import/prefer-default-export */

import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',
});

export const getData = async (path) => {
  try {
    const { data } = await instance.get(path);
    return data;
  } catch (err) {
    return null;
  }
};
