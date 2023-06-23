module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/airbnb',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-mixed-operators': 'off',
    'no-bitwise': 'off',
    'no-plusplus': 'off',
    'prefer-template': 'off',
  },
};
