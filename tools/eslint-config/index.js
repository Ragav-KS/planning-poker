import eslint from '@eslint/js';
import { configs as tsESlintConfigs } from 'typescript-eslint';

export const baseConfig = [
  eslint.configs.recommended,
  ...tsESlintConfigs.strict,
  ...tsESlintConfigs.stylistic,
];
