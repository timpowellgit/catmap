const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['.devbox/*', '.expo/*', 'dist/*', 'web-build/*'],
  },
];
