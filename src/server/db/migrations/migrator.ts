import '@/load-env';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FileMigrationProvider, Migrator } from 'kysely';

import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({ module: 'migrator' });

function createMigrator() {
  return new Migrator({
    db: kdb,
    migrationTableName: 'kysely_migrations',
    provider: new FileMigrationProvider({
      fs,
      migrationFolder: path.dirname(fileURLToPath(import.meta.url)),
      path,
    }),
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
