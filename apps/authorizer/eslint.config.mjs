import { baseConfig } from '@planning-poker/eslint-config';
import { globalIgnores } from 'eslint/config';

/** @type {import('eslint').Linter.Config[]} */
export default [...baseConfig, globalIgnores(['dist/*'])];
