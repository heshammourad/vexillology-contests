/**
 * HTTP network calls
 */

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
  const { data } = await instance.get(path, generateConfig(authToken));
  return data;
};

export const postData = async (path, newData, authToken) => {
  const response = await instance.post(
    path,
    newData,
    generateConfig(authToken),
  );
  return response;
};

// Returns the raw axios response and lets errors propagate to the caller, so callers that
// need the server's error message/status (e.g. form submissions) can read it.
export const putDataWithResponse = async (path, newData, authToken) => {
  const response = await instance.put(path, newData, generateConfig(authToken));
  return response;
};

// Like putDataWithResponse, but returns just the response data, or null on failure.
export const putData = async (path, newData, authToken) => {
  try {
    const { data } = await putDataWithResponse(path, newData, authToken);
    return data;
  } catch (err) {
    return null;
  }
};

// Returns the raw axios response and lets errors propagate to the caller, so callers that
// need the server's error message/status can read it.
export const deleteDataWithResponse = async (path, data, authToken) => {
  const response = await instance.delete(path, {
    ...generateConfig(authToken),
    data,
  });
  return response;
};

// Like deleteDataWithResponse, but returns whether the delete succeeded.
export const deleteData = async (path, data, authToken) => {
  try {
    await deleteDataWithResponse(path, data, authToken);
    return true;
  } catch (err) {
    return false;
  }
};
