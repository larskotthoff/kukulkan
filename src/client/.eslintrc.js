module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:solid/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  plugins: ['solid', 'import'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  rules: {
    'no-unused-vars': 'error',
    'import/no-unused-modules': 'error',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
