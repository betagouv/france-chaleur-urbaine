import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    alias: {
      '@/*': resolve(__dirname, 'src/*'),
      '@cli/*': resolve(__dirname, 'scripts/*'),
      '@root/*': resolve(__dirname, '*'),
    },
  },
});
