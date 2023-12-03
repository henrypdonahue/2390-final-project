module.exports = {
  root: true,
  extends: 'eslint:recommended',
  rules: {
    'indent': [2, 2, { SwitchCase: 1 }],
    'keyword-spacing': [2, { before: true, after: true }],
    'object-shorthand': [2, 'consistent'],
    'no-unused-vars': [1, { vars: 'local', args: 'none' }],
    'quote-props': [1, 'consistent-as-needed'],
    'eqeqeq': [2, 'smart'],
    'brace-style': 2,
    'curly': 2,
    'quotes': [2, 'single', { avoidEscape: true }],
    'no-trailing-spaces': 2,
    'space-before-function-paren': [
      2,
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    'no-console': 0,
    'space-before-blocks': [2, 'always'],
  },
  env: {
    browser: true,
    jquery: true,
    node: true,
    amd: true,
    es6: true,
  },

  parserOptions: {
    ecmaVersion: 8,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
};
