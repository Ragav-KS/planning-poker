import { baseConfig } from '@planning-poker/eslint-config';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/no-useless-constructor': 'off',
    },
  },
];
