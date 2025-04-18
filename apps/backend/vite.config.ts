/// <reference types="vitest" />
import devServer from '@hono/vite-dev-server';
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
        name: '@planning-poker/backend-fn',
        fileName: 'index',
        formats: ['es'],
      },
    },
    server: {
      port: 3000,
      host: '127.0.0.1',
    },
    plugins: [
      devServer({
        entry: 'src/index.ts',
        export: 'app',
      }),
    ],
  } satisfies UserConfig;
});
