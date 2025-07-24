export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {},
  },
];
