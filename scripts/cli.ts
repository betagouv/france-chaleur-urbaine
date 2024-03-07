import { fetchBaseSchema } from './airtable/dump-schema';
import { createModificationsReseau } from './airtable/create-modifications-reseau';
import { KnownAirtableBase, knownAirtableBases } from './airtable/bases';
import { downloadNetwork } from './networks/download-network';
import {
  createCommand,
  InvalidArgumentError,
} from '@commander-js/extra-typings';
import { logger } from '@helpers/logger';
import {
  DataType,
  DatabaseTileInfo,
  tilesInfo,
  zDataType,
} from 'src/services/tiles.config';
import db from 'src/db';
import { readFile } from 'fs/promises';
import { fillTiles } from './utils/tiles';
import { generateTilesFromGeoJSON } from './networks/generate-tiles';

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
  .command('fill-tiles')
  .argument('<network-id>', 'Network id', (v) => zDataType.parse(v))
  .argument('[zoomMin]', 'Minimum zoom', parseInt, 0)
  .argument('[zoomMax]', 'Maximum zoom', parseInt, 17)
  .argument('[withIndex]', 'With index', (v) => !!v, false)
  .action(async (table, zoomMin, zoomMax, withIndex) => {
    await db((tilesInfo[table] as DatabaseTileInfo).tiles).delete();
    await fillTiles(table, zoomMin, zoomMax, withIndex);
  });

program
  .command('generate-tiles-from-file')
  .argument('<fileName>', 'input file (format GeoJSON)')
  .argument('<destinationTable>', 'Destination table')
  .argument('[zoomMin]', 'Minimum zoom', parseInt, 0)
  .argument('[zoomMax]', 'Maximum zoom', parseInt, 17)
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
  .argument('<network-id>', 'Network id', (v) => zDataType.parse(v))
  .argument('[zoomMin]', 'Minimum zoom', parseInt, 0)
  .argument('[zoomMax]', 'Maximum zoom', parseInt, 17)
  .argument('[withIndex]', 'With index', (v) => !!v, false)
  .action(async (table, zoomMin, zoomMax, withIndex) => {
    await downloadNetwork(table);
    await db((tilesInfo[table] as DatabaseTileInfo).tiles).delete();
    await fillTiles(table, zoomMin, zoomMax, withIndex);
  });

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, async () => {
    logger.warn('Received stop signal');
    process.exit(2);
  });
});

program.parse();

function validateKnownAirtableBase(value: string): KnownAirtableBase {
  if (!(value in knownAirtableBases)) {
    throw new InvalidArgumentError(
      `invalid base "${value}", expected any of ${Object.keys(
        knownAirtableBases
      )}.`
    );
  }
  return value as KnownAirtableBase;
}

function validateNetworkId(value: string): DataType {
  const tileInfo = tilesInfo[value as DataType];
  if (!tileInfo || !(tileInfo as any).airtable) {
    throw new InvalidArgumentError(
      `invalid network id "${value}", expected any of ${Object.keys(
        tilesInfo // minus .airtable property
      )}.`
    );
  }
  return value as DataType;
}
