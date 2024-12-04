import { readFile } from 'fs/promises';

import { InvalidArgumentError, createCommand } from '@commander-js/extra-typings';

import { saveStatsInDB } from '@/server/cron/saveStatsInDB';
import db from '@/server/db';
import { logger } from '@/server/helpers/logger';
import { type DatabaseTileInfo, type DatabaseSourceId, tilesInfo, zDatabaseSourceId } from '@/services/tiles.config';

import { type KnownAirtableBase, knownAirtableBases } from './airtable/bases';
import { createModificationsReseau } from './airtable/create-modifications-reseau';
import { fetchBaseSchema } from './airtable/dump-schema';
import { downloadNetwork, downloadAndUpdateNetwork } from './networks/download-network';
import { generateTilesFromGeoJSON } from './networks/generate-tiles';
import { applyGeometryUpdates } from './networks/geometry-updates';
import { importMvtDirectory } from './networks/import-mvt-directory';
import { syncPostgresToAirtable } from './networks/sync-pg-to-airtable';
import { upsertFixedSimulateurData } from './simulateur/import';
import { fillTiles } from './utils/tiles';

const program = createCommand();

program
  .name('FCU CLI')
  .version('0.1.0')
  .hook('postAction', async () => {
    await db.destroy();
  });

program
  .command('create-modifications-reseau')
  .argument('<airtable_base>', 'Base Airtable', validateKnownAirtableBase)
  .action(async (airtableBase) => {
    await createModificationsReseau(airtableBase);
  });

program
  .command('dump-schema')
  .argument('<airtable_base>', 'Base Airtable', validateKnownAirtableBase)
  .action(async (airtableBase) => {
    await fetchBaseSchema(airtableBase);
  });

program
  .command('download-network')
  .argument('<network-id>', 'Network id', validateNetworkId)
  .action(async (table) => {
    await downloadNetwork(table);
  });

program
  .command('download-and-update-network')
  .argument('<network-id>', 'Network id', validateNetworkId)
  .action(async (table) => {
    await downloadAndUpdateNetwork(table);
  });

program
  .command('fill-tiles')
  .argument('<network-id>', 'Network id', (v) => zDatabaseSourceId.parse(v))
  .argument('[zoomMin]', 'Minimum zoom', (v) => parseInt(v), 0)
  .argument('[zoomMax]', 'Maximum zoom', (v) => parseInt(v), 17)
  .argument('[withIndex]', 'With index', (v) => !!v, false)
  .action(async (table, zoomMin, zoomMax, withIndex) => {
    await db((tilesInfo[table] as DatabaseTileInfo).tiles).delete();
    await fillTiles(table, zoomMin, zoomMax, withIndex);
  });

program
  .command('import-mvt-directory')
  .argument('<mvtDirectory>', 'MVT directory root')
  .argument('<destinationTable>', 'Destination table')
  .action(async (mvtDirectory, destinationTable) => {
    if (await db.schema.hasTable(destinationTable)) {
      logger.info('flushing destination table', {
        table: destinationTable,
      });
      await db(destinationTable).delete();
    } else {
      logger.info('destination table does not exist, creating it', {
        table: destinationTable,
      });
      await db.schema.createTable(destinationTable, (table) => {
        table.bigInteger('x').notNullable();
        table.bigInteger('y').notNullable();
        table.bigInteger('z').notNullable();
        table.specificType('tile', 'bytea').notNullable();
        table.primary(['x', 'y', 'z']);
      });
    }

    await importMvtDirectory(mvtDirectory, destinationTable);
  });

program
  .command('generate-tiles-from-file')
  .argument('<fileName>', 'input file (format GeoJSON)')
  .argument('<destinationTable>', 'Destination table')
  .argument('[zoomMin]', 'Minimum zoom', (v) => parseInt(v), 0)
  .argument('[zoomMax]', 'Maximum zoom', (v) => parseInt(v), 17)
  .action(async (fileName, destinationTable, zoomMin, zoomMax) => {
    const geojson = JSON.parse(await readFile(fileName, 'utf8'));

    logger.info('start importing geojson features', {
      count: geojson.features?.length,
    });

    if (!(await db.schema.hasTable(destinationTable))) {
      logger.info('destination table does not exist, creating it', {
        table: destinationTable,
      });
      await db.schema.createTable(destinationTable, (table) => {
        table.bigInteger('x').notNullable();
        table.bigInteger('y').notNullable();
        table.bigInteger('z').notNullable();
        table.specificType('tile', 'bytea').notNullable();
        table.primary(['x', 'y', 'z']);
      });
    }

    logger.info('flushing table', { table: destinationTable });
    await db(destinationTable).delete();

    await generateTilesFromGeoJSON(geojson, destinationTable, zoomMin, zoomMax);
  });

program
  .command('update-networks')
  .argument('<network-id>', 'Network id', (v) => zDatabaseSourceId.parse(v))
  .argument('[zoomMin]', 'Minimum zoom', (v) => parseInt(v), 0)
  .argument('[zoomMax]', 'Maximum zoom', (v) => parseInt(v), 17)
  .argument('[withIndex]', 'With index', (v) => !!v, false)
  .action(async (table, zoomMin, zoomMax, withIndex) => {
    await downloadAndUpdateNetwork(table);
    await db((tilesInfo[table] as DatabaseTileInfo).tiles).delete();
    await fillTiles(table, zoomMin, zoomMax, withIndex);
  });

program
  .command('apply-geometry-updates')
  .option('--dry-run', 'Run the command in dry-run mode', false)
  .action(async ({ dryRun }) => {
    await applyGeometryUpdates(dryRun);
  });

program
  .command('sync-postgres-to-airtable')
  .option('--dry-run', 'Run the command in dry-run mode', false)
  .action(async ({ dryRun }) => {
    await syncPostgresToAirtable(dryRun);
  });

program
  .command('update-simulateur')
  .description('Take AMORCE file and either create records in database or update them.')
  .argument('<filepath>', 'Path to the Amorce file')
  .action(async (filepath) => {
    await upsertFixedSimulateurData(filepath);
  });

program
  .command('update-monthly-stats')
  .description('Update the table matomo_stats used by the stats page. Data come from Matomo and Airtable.')
  .argument('[start-date]', 'Format : YYYY-MM-DD')
  .argument('[end-date]', 'Format : YYYY-MM-DD')
  .action(async (startDate, endDate) => {
    await saveStatsInDB(startDate, endDate);
  });

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, async () => {
    logger.warn('Received stop signal');
    process.exit(2);
  });
});

(async () => {
  try {
    await program.parseAsync();
  } catch (err) {
    console.error('command error', err);
    process.exit(2);
  }
})();

function validateKnownAirtableBase(value: string): KnownAirtableBase {
  if (!(value in knownAirtableBases)) {
    throw new InvalidArgumentError(`invalid base "${value}", expected any of ${Object.keys(knownAirtableBases)}.`);
  }
  return value as KnownAirtableBase;
}

function validateNetworkId(value: string): DatabaseSourceId {
  const tileInfo = tilesInfo[value as DatabaseSourceId];
  if (!tileInfo || !(tileInfo as any).airtable) {
    throw new InvalidArgumentError(
      `invalid network id "${value}", expected any of ${Object.keys(
        tilesInfo // minus .airtable property
      )}.`
    );
  }
  return value as DatabaseSourceId;
}
