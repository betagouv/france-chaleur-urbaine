import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    alias: {
      '@utils/*': resolve(__dirname, 'src/utils/*'),
      '@helpers/*': resolve(__dirname, 'src/helpers/*'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@hooks/*': resolve(__dirname, 'src/hooks/*'),
      '@components/*': resolve(__dirname, 'src/components/*'),
      '@data': resolve(__dirname, 'src/data'),
      '@data/*': resolve(__dirname, 'src/data/*'),
      '@constants': resolve(__dirname, 'src/constants'),
      '@pages/*': resolve(__dirname, 'src/pages/*'),
      '@libs/*': resolve(__dirname, 'src/libs/*'),
      '@styles/*': resolve(__dirname, 'src/styles/*'),
      '@core/*': resolve(__dirname, 'src/core/*'),
    },
  },
});
