/// <reference types="vitest" />
import { builtinModules } from 'module';
import { resolve } from 'path';
import { defineConfig, UserConfig } from 'vite';

export default defineConfig(() => {
  return {
    envDir: './environments',
    build: {
      target: 'node22',
      minify: false,
      sourcemap: false,
      outDir: 'dist',
      rollupOptions: {
        output: {
          entryFileNames: '[name].mjs',
          sourcemapExcludeSources: true,
        },
        external: [...builtinModules, /^@aws-sdk\/*/, /^node:/],
      },
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: '@planning-poker/authorizer',
        fileName: 'index',
        formats: ['es'],
      },
    },
  } satisfies UserConfig;
});
