import { readdirSync } from 'node:fs';
import { basename } from 'node:path';

import { defineConfig } from 'tsup';

export default defineConfig(() => {
  const entry = {
    cli: 'scripts/cli.ts',
  };
  // keep the structure
  const migrationFiles = readdirSync('./src/db/migrations');
  for (const filename of migrationFiles) {
    entry[`migrations/${basename(filename, '.ts')}`] = `src/db/migrations/${filename}`;
  }

  return {
    entry,
    format: ['cjs'],
    outDir: '.next/cli/',
    bundle: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    minify: true,
    env: {
      KNEX_MIGRATIONS_DIR: './.next/cli/migrations',
    },

    // include node_modules dependencies
    external: [],
    noExternal: ['*'],
  };
});
