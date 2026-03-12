const paceCoreConfig = require('@jmruthers/pace-core/eslint-config');
const tseslint = require('typescript-eslint');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    ...tseslint.configs.base,
    files: ['**/*.ts', '**/*.tsx'],
  },
  ...paceCoreConfig,
  // Your app-specific ESLint configuration
  {
    // Add your rules here
  },
];
