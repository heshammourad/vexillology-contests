// WARNING! All process.env values are strings, so check for 'true' or 'false'

const {
  NODE_ENV,
} = process.env;

export const IS_DEV = NODE_ENV !== 'production';
