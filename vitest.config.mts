import { availableParallelism } from 'node:os';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.md', '**/*.svgr', '**/*.mdx'],
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@/client-config': resolve(import.meta.dirname, 'src/client-config.ts'),
      '@cli': resolve(import.meta.dirname, 'scripts'),
      '@root': resolve(import.meta.dirname, '.'),
    },
    coverage: {
      exclude: ['src/**/*.{d.ts,test.ts,spec.ts,test.tsx,spec.tsx}', 'src/{app,pages,tests}/**'],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
    environment: 'happy-dom',
    exclude: ['**/{.git,node_modules,dist,.next}/**', 'src/tests/a11y/**', 'src/**/*.e2e.spec.{ts,tsx}'],
    // Shared by both projects: a project with its own maxWorkers needs its own sequence.groupOrder, and Vitest 5.0.1
    // then hands out a VITEST_POOL_ID still in use when switching groups (two integration files on the same database).
    // 8 integration workers × DATABASE_POOL_MAX (10, see setup-mocks.ts) stay under the Postgres max_connections (100).
    maxWorkers: Math.min(8, availableParallelism()),
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
          exclude: ['src/**/*.integration.spec.{ts,tsx}', 'src/**/*.e2e.spec.{ts,tsx}'],
          fileParallelism: true,
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          name: 'unit',
        },
      },
      // Tests d'intégration (BDD) - parallèle, une base clonée par worker (voir integration-global-setup.ts)
      {
        extends: true,
        test: {
          environment: 'node',
          globalSetup: ['./src/tests/integration-global-setup.ts'],
          include: ['src/**/*.integration.spec.{ts,tsx}'],
          name: 'integration',
          setupFiles: ['./src/tests/integration-setup.ts'],
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
