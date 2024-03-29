module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
    'vue/setup-compiler-macros': true,
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
    'lines-between-class-members': 'off',
    'no-restricted-syntax': 'off',
    'no-confusing-arrow': 'off',
    'import/prefer-default-export': 'off',
  },
};
