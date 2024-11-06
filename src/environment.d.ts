declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR?: 'true' | 'false';
    }
  }
}

export {};
