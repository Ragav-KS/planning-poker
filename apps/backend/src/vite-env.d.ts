/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IS_LOCAL_RUN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
