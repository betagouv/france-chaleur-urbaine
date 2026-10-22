import '@/load-env';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { sql } from 'kysely';
import { type Migration, type MigrationProvider, Migrator } from 'kysely/migration';

import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({ module: 'migrator' });

const migrationTableName = 'kysely_migrations';

// On doit surcharger cette classe car FileMigrationProvider gère mal les chemins windows
class UrlFileMigrationProvider implements MigrationProvider {
  constructor(
    private readonly options: {
      migrationFolder: string;
      excludeFile?: string;
      /** Register a no-op stub for every migration already applied in DB but absent from the folder (e.g. branch behind a shared DB) */
      ignoreMissing?: boolean;
    }
  ) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const { migrationFolder, excludeFile, ignoreMissing } = this.options;

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

    if (ignoreMissing) {
      for (const name of await getExecutedMigrationNames()) {
        if (!migrations[name]) {
          logger.warn(`migration "${name}" is applied in DB but missing from the code, ignoring it`);
          migrations[name] = {
            down: async () => {
              throw new Error(`cannot roll back migration "${name}": its code is missing`);
            },
            up: async () => {},
          };
        }
      }
    }

    return migrations;
  }
}

async function getExecutedMigrationNames(): Promise<string[]> {
  const { rows: tables } = await sql<{ exists: boolean }>`select to_regclass(${migrationTableName}) is not null as exists`.execute(kdb);
  if (!tables[0]?.exists) {
    return [];
  }
  const { rows } = await sql<{ name: string }>`select name from ${sql.table(migrationTableName)}`.execute(kdb);
  return rows.map((row) => row.name);
}

function createMigrator(options: { ignoreMissing: boolean }) {
  const thisFilePath = fileURLToPath(import.meta.url);
  const migrationFolder = path.dirname(thisFilePath);
  const excludeFile = path.basename(thisFilePath);

  return new Migrator({
    allowUnorderedMigrations: true,
    db: kdb,
    migrationTableName,
    provider: new UrlFileMigrationProvider({ excludeFile, ignoreMissing: options.ignoreMissing, migrationFolder }),
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

async function migrateToLatest(options: { ignoreMissing: boolean }) {
  const migrator = createMigrator(options);
  const { error, results } = await migrator.migrateToLatest();

  logMigrationResults(results, 'executed');

  if (error) {
    throw new Error(`Migration failed: ${error}`);
  }

  logger.info('migrations completed successfully');
}

async function migrateDown(options: { ignoreMissing: boolean }) {
  const migrator = createMigrator(options);
  const { error, results } = await migrator.migrateDown();

  logMigrationResults(results, 'rolled back');

  if (error) {
    throw new Error(`Rollback failed: ${error}`);
  }

  logger.info('rollback completed successfully');
}

async function main() {
  const [command, ...flags] = process.argv.slice(2);
  const options = { ignoreMissing: flags.includes('--ignore-missing') };

  try {
    switch (command) {
      case 'up':
      case 'latest':
        await migrateToLatest(options);
        break;
      case 'down':
        await migrateDown(options);
        break;
      default:
        logger.error('Usage: tsx migrator.ts [up|latest|down] [--ignore-missing]');
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
