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
      exclude: ['src/**/*.{d.ts,test.ts,spec.ts,test.tsx,spec.tsx}', 'src/{app,pages,tests}/**'],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
    environment: 'happy-dom',
    exclude: ['**/{.git,node_modules,dist,.next}/**'],
    onConsoleLog: (log) => {
      // Suppress specific React warnings
      if (log.includes('React does not recognize')) {
        return false;
      }
    },
    projects: [
      // Tests unitaires - parallèle
      {
        extends: true,
        test: {
          exclude: ['src/**/*.integration.spec.{ts,tsx}'],
          fileParallelism: true,
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          name: 'unit',
        },
      },
      // Tests d'intégration (BDD) - séquentiel pour éviter les conflits BDD
      {
        extends: true,
        test: {
          fileParallelism: false,
          include: ['src/**/*.integration.spec.{ts,tsx}'],
          name: 'integration',
        },
      },
    ],
    server: {
      deps: {
        inline: ['@/client-config'],
      },
    },
    setupFiles: ['./src/tests/setup-mocks.ts'],
  },
});
