module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: ['airbnb-base'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2023,
    requireConfigFile: false,
  },
  rules: {
    'no-console': 'off',
    'consistent-return': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
  },
};
