import { readFile } from 'fs/promises';

import { InvalidArgumentError, createCommand } from '@commander-js/extra-typings';

import { logger } from '@helpers/logger';
import db from 'src/db';
import { DatabaseTileInfo, SourceId, tilesInfo, zSourceId } from 'src/services/tiles.config';

import { KnownAirtableBase, knownAirtableBases } from './airtable/bases';
import { createModificationsReseau } from './airtable/create-modifications-reseau';
import { fetchBaseSchema } from './airtable/dump-schema';
import { downloadNetwork } from './networks/download-network';
import { generateTilesFromGeoJSON } from './networks/generate-tiles';
import { importMvtDirectory } from './networks/import-mvt-directory';
import AmorceFileReader from './simulateur/AmorceFileReader';
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
  .command('fill-tiles')
  .argument('<network-id>', 'Network id', (v) => zSourceId.parse(v))
  .argument('[zoomMin]', 'Minimum zoom', parseInt, 0)
  .argument('[zoomMax]', 'Maximum zoom', parseInt, 17)
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
  .argument('<network-id>', 'Network id', (v) => zSourceId.parse(v))
  .argument('[zoomMin]', 'Minimum zoom', parseInt, 0)
  .argument('[zoomMax]', 'Maximum zoom', parseInt, 17)
  .argument('[withIndex]', 'With index', (v) => !!v, false)
  .action(async (table, zoomMin, zoomMax, withIndex) => {
    await downloadNetwork(table);
    await db((tilesInfo[table] as DatabaseTileInfo).tiles).delete();
    await fillTiles(table, zoomMin, zoomMax, withIndex);
  });

program
  .command('update-simulateur')
  .argument('<filepath>', 'Path to the Amorce file')
  .action(async (filepath) => {
    const reader = new AmorceFileReader(filepath);
    const departmentData = reader.getDepartementData();

    for (const dept of departmentData) {
      try {
        await db('departements')
          .insert({
            nom_departement: dept['Nom département'],
            id: dept['Code département'],
            dju_chaud_moyen: dept['DJU chaud moyen'],
            dju_froid_moyen: dept['DJU froid moyen'],
            zone_climatique: dept['Zone climatique'],
            source: dept['Source '],
            annee: dept['Année'],
          })
          .onConflict('id')
          .merge();
      } catch (error: any) {
        console.error('Error updating department:', error.toString());
        console.error(dept);
      }
    }

    const cityData = reader.getCityData();

    let count = 0;
    for (const city of cityData) {
      count++;
      if (count % 1000 === 0) {
        console.log(`Processing city ${count}/${cityData.length}`);
      }

      try {
        await db('communes')
          .insert({
            id: city['Code commune INSEE'],
            code_postal: city['Code postal'],
            commune: city.Commune,
            departement_id: city['Département'],
            altitude_moyenne: city['Altitude moyenne'],
            temperature_ref_altitude_moyenne: city['T°C réf / altitude_moyenne'] || 0,
            source: city['Source '],
            sous_zones_climatiques: city['Sous-zones climatiques'],
          })
          .onConflict('id')
          .merge();
      } catch (error: any) {
        console.error('Error updating city:', error.toString());
        console.error(city);
      }
    }
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
    throw new InvalidArgumentError(`invalid base "${value}", expected any of ${Object.keys(knownAirtableBases)}.`);
  }
  return value as KnownAirtableBase;
}

function validateNetworkId(value: string): SourceId {
  const tileInfo = tilesInfo[value as SourceId];
  if (!tileInfo || !(tileInfo as any).airtable) {
    throw new InvalidArgumentError(
      `invalid network id "${value}", expected any of ${Object.keys(
        tilesInfo // minus .airtable property
      )}.`
    );
  }
  return value as SourceId;
}
