/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly IS_LOCAL_RUN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
