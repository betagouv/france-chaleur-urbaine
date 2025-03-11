declare global {
  namespace NodeJS {
    interface ProcessEnv {
      IS_REVIEW_APP: 'true' | 'false';
      NODE_ENV: 'development' | 'production';
      GITHUB_CI?: 'true';
    }
  }
}

export {};
