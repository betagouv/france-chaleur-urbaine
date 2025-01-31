import { readFile } from 'fs/promises';

import { InvalidArgumentError, createCommand } from '@commander-js/extra-typings';
import prompts from 'prompts';

import { saveStatsInDB } from '@/server/cron/saveStatsInDB';
import db from '@/server/db';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import {
  type ApiNetwork,
  createGestionnairesFromAPI,
  syncGestionnairesWithUsers,
  syncLastConnectionFromUsers,
} from '@/server/services/airtable';
import { type DatabaseSourceId, type DatabaseTileInfo, tilesInfo, zDatabaseSourceId } from '@/server/services/tiles.config';
import { type ApiAccount } from '@/types/ApiAccount';
import { sleep } from '@/utils/time';

import { type KnownAirtableBase, knownAirtableBases } from './airtable/bases';
import { createModificationsReseau } from './airtable/create-modifications-reseau';
import { fetchBaseSchema } from './airtable/dump-schema';
import { readFileGeometry } from './helpers/geo';
import { runShellScript } from './helpers/shell';
import { downloadAndUpdateNetwork, downloadNetwork } from './networks/download-network';
import { generateTilesFromGeoJSON } from './networks/generate-tiles';
import { applyGeometryUpdates } from './networks/geometry-updates';
import { importMvtDirectory } from './networks/import-mvt-directory';
import { syncPostgresToAirtable } from './networks/sync-pg-to-airtable';
import { upsertFixedSimulateurData } from './simulateur/import';
import { fillTiles } from './utils/tiles';

const program = createCommand();

async function warnOnProdDatabase(): Promise<void> {
  if (process.env.DATABASE_URL?.includes('postgres_fcu@localhost')) {
    return;
  }
  const response = await prompts({
    type: 'confirm',
    name: 'agree',
    message: 'Vous allez lancer la commande sur une base non locale, êtes-vous sûr de vouloir continuer ?',
    initial: true,
  });

  if (!response.agree) {
    process.exit(2);
  }

  await sleep(2000); // Wait 2 seconds in case operator changes his mind
}

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
  .description("Synchronise les données d'une table réseau de Airtable vers la table correspondante dans Postgres.")
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
  .description("Regénère les tuiles d'une table en base")
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
  .description(
    'Importe en base une arborescence de tuiles vectorielles. A utiliser typiquement après avoir utilisé tippecanoe. Exemple : `yarn cli import-mvt-directory tiles/zone_a_potentiel_fort_chaud zone_a_potentiel_fort_chaud_tiles`'
  )
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
  .description(
    "Génère des tuiles vectorielles à partir d'un fichier GeoJSON et les enregistre dans postgres. Exemple : `yarn cli generate-tiles-from-file reseaux_de_chaleur.geojson reseaux_de_chaleur_tiles 0 14`"
  )
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
  .command('opendata:create-archive')
  .description(
    "Cette commande permet de générer l'archive OpenData contenant les données de France Chaleur Urbaine au format Shapefile et GeoJSON. L'archive générée devra être envoyée à Florence en vue d'un dépôt sur la plateforme data.gouv.fr"
  )
  .action(async () => {
    await runShellScript('scripts/opendata/create-opendata-archive.sh');
  });

program
  .command('reseaux:update-geom')
  .description(
    "Met à jour la géométrie d'un réseau. Attention, le fichier contenant la géométrie doit être au format WGS 84 (4326) et non Lambert 93 (2154)"
  )
  .argument('<id_fcu>', 'id_fcu du réseau', (v) => parseInt(v))
  .argument('<fileName>', 'input file (format GeoJSON srid 4326)')
  .action(async (id_fcu, fileName) => {
    const geom = await readFileGeometry(fileName);
    await kdb
      .with('geometry', (db) => db.selectNoFrom(sql.lit(JSON.stringify(geom)).as('geom')))
      .updateTable('reseaux_de_chaleur')
      .where('id_fcu', '=', id_fcu)
      .set({
        geom: (eb) => eb.selectFrom('geometry').select(sql<string>`st_transform(ST_GeomFromGeoJSON(geometry.geom), 2154)`.as('geom')),
        has_trace: (eb) =>
          eb.selectFrom('geometry').select(sql<boolean>`st_geometrytype(geometry.geom) = 'ST_MultiLineString'`.as('has_trace')),
      })
      .execute();
  });

program
  .command('reseaux:insert-geom')
  .description(
    'Insère un nouveau réseau (avoir créé le réseau sur airtable au préalable) avec une géométrie. Attention, le fichier contenant la géométrie doit être au format WGS 84 (4326) et non Lambert 93 (2154)'
  )
  .argument('<id_fcu>', 'id_fcu du réseau', (v) => parseInt(v))
  .argument('<fileName>', 'input file (format GeoJSON srid 4326)')
  .action(async (id_fcu, fileName) => {
    const geom = await readFileGeometry(fileName);
    await kdb
      .with('geometry', (db) => db.selectNoFrom(sql.lit(JSON.stringify(geom)).as('geom')))
      .insertInto('reseaux_de_chaleur')
      .columns(['id_fcu', 'geom', 'has_trace', 'communes', 'reseaux classes', 'reseaux_techniques', 'fichiers'])
      .expression((eb) =>
        eb
          .selectFrom('geometry')
          .select((eb) => [
            eb.lit(id_fcu).as('id_fcu'),
            sql<any>`st_transform(ST_GeomFromGeoJSON(geometry.geom), 2154)`.as('geom'),
            sql<boolean>`st_geometrytype(geometry.geom) = 'ST_MultiLineString'`.as('has_trace'),
            eb.val([]).as('communes'),
            eb.lit(false).as('reseaux classes'),
            eb.lit(false).as('reseaux_techniques'),
            eb.val([]).as('fichiers'),
          ])
      )
      .execute();
  });

program
  .command('reseaux:update-communes')
  .description("Met à jour les communes des réseaux de chaleur / froid / en construction, pdp grâce aux coutours des communes de l'IGN.")
  .action(async () => {
    const res = await sql`
    update reseaux_de_chaleur
    set communes = COALESCE(
      (
        SELECT array_agg(nom order by nom)
        FROM ign_communes
        WHERE ST_Intersects(reseaux_de_chaleur.geom, st_buffer(ign_communes.geom, -150))
      ),
      (
        SELECT array_agg(nom order by nom)
        FROM ign_communes
        WHERE ST_Intersects(reseaux_de_chaleur.geom, ign_communes.geom)
      )
    )::text[]
  `.execute(kdb);
    console.info('updates', res.numAffectedRows);
  });

program
  .command('apply-geometry-updates')
  .description("Applique les changements suite à l'import d'un dump et met à jour postgres et Airtable (obsolète pour le moment)")
  .option('--dry-run', 'Run the command in dry-run mode', false)
  .action(async ({ dryRun }) => {
    await applyGeometryUpdates(dryRun);
  });

program
  .command('sync-postgres-to-airtable')
  .description('Synchronise les tables postgres FCU vers Airtable pour les champs has_trace, is_zone, communes')
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

program
  .command('debug:upsert-users-from-api')
  .description('Update Gestionnaires and Gestionnaires API airtables from file.')
  .argument('<accountKey>', 'Key of the account in api_accounts')
  .argument('<file>', 'File with data')
  .action(async (accountKey, file) => {
    const account: ApiAccount = await db('api_accounts').where('key', accountKey).first();
    const data: ApiNetwork[] = JSON.parse(await readFile(file, 'utf8'));

    if (!process.env.DRY_RUN) {
      logger.info('');
      logger.info('USAGE:');
      logger.info('⚠️ DRY_RUN is not set, use FIRST_TIME_FIX=<true|false> DRY_RUN=<true|false> yarn cli debug:upsert-users-from-api ...');
      process.exit(1);
    }
    await createGestionnairesFromAPI(account, data);
  });

program
  .command('users:sync-from-airtable')
  .description('Sync users created in Airtable in PostGres.')
  .action(async () => {
    if (!process.env.DRY_RUN) {
      logger.info('');
      logger.info('USAGE:');
      logger.info('⚠️ DRY_RUN is not set, use DRY_RUN=<true|false> yarn cli users:sync-from-airtable');
      process.exit(1);
    }
    await syncGestionnairesWithUsers();
  });

program
  .command('users:sync-last-connection-to-airtable')
  .description('Sync users last connection from PostGres to Airtable.')
  .action(async () => {
    if (!process.env.DRY_RUN) {
      logger.info('');
      logger.info('USAGE:');
      logger.info('⚠️ DRY_RUN is not set, use DRY_RUN=<true|false> yarn cli users:sync-last-connection-to-airtable');
      process.exit(1);
    }
    await syncLastConnectionFromUsers();
  });

program
  .command('bdnd:export')
  .description('')
  .action(async () => {
    console.info('Veuillez regarder les étapes dans scripts/bdnb/README.md');
  });

program
  .command('bdnd:export-qpv')
  .description('')
  .action(async () => {
    console.info('Veuillez regarder les étapes dans scripts/bdnb/qpv/README.md');
  });

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, async () => {
    logger.warn('Received stop signal');
    process.exit(2);
  });
});

(async () => {
  try {
    await warnOnProdDatabase();

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
