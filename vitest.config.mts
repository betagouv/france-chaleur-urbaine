import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.md', '**/*.svgr', '**/*.mdx'],
  plugins: [tsconfigPaths(), react()],
  test: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/client-config': resolve(__dirname, 'src/client-config.ts'),
      '@cli': resolve(__dirname, 'scripts'),
      '@react-hookz/web/useCookieValue': resolve(__dirname, 'node_modules/@react-hookz/web/dist/useCookieValue/index.js'),
      '@root': resolve(__dirname, '.'),
    },
    coverage: {
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.tsx',
        'src/**/*.spec.tsx',
        'src/tests/**',
        'src/pages/**',
        'src/app/**',
      ],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
    environment: 'happy-dom',
    fileParallelism: false, // Disable parallel file execution to avoid database conflicts between integration tests
    onConsoleLog: (log) => {
      // Suppress specific React warnings
      if (log.includes('React does not recognize')) {
        return false;
      }
    },
    server: {
      deps: {
        inline: ['@/client-config'],
      },
    },
    setupFiles: ['./src/tests/setup-mocks.ts'],
  },
});
