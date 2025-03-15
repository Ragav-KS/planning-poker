import type { UserConfig } from '@commitlint/types';
import myPlugin from '@ragav-ks/commitlint-plugin-imperative';

const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'imperative-subject': [2, 'always', { debug: true }],
  },
  plugins: [myPlugin],
} satisfies UserConfig;

export default config;
