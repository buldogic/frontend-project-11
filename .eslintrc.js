module.exports = {
  plugins: ['jest'],
  env: {
    node: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
    'no-underscore-dangle': [2, { allow: ['__filename', '__dirname'] }],
  },
};