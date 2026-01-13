import '@/load-env';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { type Migration, type MigrationProvider, Migrator } from 'kysely';

import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({ module: 'migrator' });

class UrlFileMigrationProvider implements MigrationProvider {
  constructor(
    private readonly options: {
      migrationFolder: string;
      excludeFile?: string;
    }
  ) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const { migrationFolder, excludeFile } = this.options;

    const entries = await fs.readdir(migrationFolder, { withFileTypes: true });

    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(ts|js|mjs|cjs)$/.test(name)) // Only load migration modules
      .filter((name) => (excludeFile ? name !== excludeFile : true)) // Do not load this runner file as a "migration"
      .sort((a, b) => a.localeCompare(b));

    const migrations: Record<string, Migration> = {};

    for (const fileName of files) {
      const absPath = path.join(migrationFolder, fileName);

      // Convert Windows paths (C:\...) into file:// URLs for ESM import()
      const mod = await import(pathToFileURL(absPath).href);

      const up = mod.up ?? mod.default?.up;
      const down = mod.down ?? mod.default?.down;

      const migrationName = fileName.replace(/\.(ts|js|mjs|cjs)$/, '');
      migrations[migrationName] = { down, up };
    }

    return migrations;
  }
}

function createMigrator() {
  const thisFilePath = fileURLToPath(import.meta.url);
  const migrationFolder = path.dirname(thisFilePath);
  const excludeFile = path.basename(thisFilePath);

  return new Migrator({
    db: kdb,
    migrationTableName: 'kysely_migrations',
    provider: new UrlFileMigrationProvider({ excludeFile, migrationFolder }),
  });
}

function logMigrationResults(results: Awaited<ReturnType<Migrator['migrateToLatest']>>['results'], action: 'executed' | 'rolled back') {
  for (const it of results ?? []) {
    if (it.status === 'Success') {
      logger.info(`migration "${it.migrationName}" was ${action} successfully`);
    } else if (it.status === 'Error') {
      logger.error(`failed to ${action === 'executed' ? 'execute' : 'roll back'} migration "${it.migrationName}"`);
    }
  }
}

async function migrateToLatest() {
  const migrator = createMigrator();
  const { error, results } = await migrator.migrateToLatest();

  logMigrationResults(results, 'executed');

  if (error) {
    throw new Error(`Migration failed: ${error}`);
  }

  logger.info('migrations completed successfully');
}

async function migrateDown() {
  const migrator = createMigrator();
  const { error, results } = await migrator.migrateDown();

  logMigrationResults(results, 'rolled back');

  if (error) {
    throw new Error(`Rollback failed: ${error}`);
  }

  logger.info('rollback completed successfully');
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'up':
      case 'latest':
        await migrateToLatest();
        break;
      case 'down':
        await migrateDown();
        break;
      default:
        logger.error('Usage: tsx migrator.ts [up|latest|down]');
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration error:', error);
    process.exit(1);
  } finally {
    await kdb.destroy();
  }
}

main();
