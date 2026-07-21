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
    // Disable no-console since this is a CLI script meant to run in GitHub Actions
    'no-console': 'off',
    // Allow functions to end without an explicit return statement (e.g., helpers and process exits)
    'consistent-return': 'off',
    // Allow await in loops to support sequential, rate-limited API retries
    'no-await-in-loop': 'off',
    // Allow continue in loops to skip excluded/minified file diffs
    'no-continue': 'off',
  },
};
