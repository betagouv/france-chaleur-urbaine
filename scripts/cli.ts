import { existsSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';

import { createCommand, InvalidArgumentError } from '@commander-js/extra-typings';
import camelcase from 'camelcase';
import prompts from 'prompts';
import { z } from 'zod';

import { saveStatsInDB } from '@/server/cron/saveStatsInDB';
import db from '@/server/db';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import {
  type ApiNetwork,
  createGestionnairesFromAPI,
  syncGestionnairesWithUsers,
  syncLastConnectionFromUsers,
} from '@/server/services/airtable';
import { processJobById, processJobsIndefinitely } from '@/server/services/jobs/processor';
import { type DatabaseSourceId, type DatabaseTileInfo, tilesInfo, zDatabaseSourceId } from '@/server/services/tiles.config';
import { type ApiAccount } from '@/types/ApiAccount';
import { sleep } from '@/utils/time';
import { nonEmptyArray } from '@/utils/typescript';
import { optimisationProfiles, optimizeImage } from '@cli/images/optimize';

import { type KnownAirtableBase, knownAirtableBases } from './airtable/bases';
import { createModificationsReseau } from './airtable/create-modifications-reseau';
import { fetchBaseSchema } from './airtable/dump-schema';
import dataImportManager, { dataImportAdapters, type DataImportName } from './data-import';
import { detectSrid, readFileGeometry } from './helpers/geo';
import { runBash, runCommand } from './helpers/shell';
import { downloadAndUpdateNetwork, downloadNetwork } from './networks/download-network';
import { applyGeometryUpdates } from './networks/geometry-updates';
import { syncPostgresToAirtable } from './networks/sync-pg-to-airtable';
import { upsertFixedSimulateurData } from './simulateur/import';
import tilesManager, { tilesAdapters, type TilesName } from './tiles';
import { fillTiles, importGeoJSONToTable, importTilesDirectoryToTable } from './tiles/utils';

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
  .command('tiles:fill')
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
  .command('tiles:import-tiles-directory')
  .description(
    'Importe en base une arborescence de tuiles vectorielles. A utiliser typiquement après avoir utilisé tippecanoe. Exemple : `yarn cli tiles:import-mvt-directory tiles/zone_a_potentiel_fort_chaud zone_a_potentiel_fort_chaud_tiles`'
  )
  .argument('<tilesDirectory>', 'Tiles directory root for MVT (Mapbox Vector Tiles)')
  .argument('<destinationTable>', 'Destination table')
  .action(async (tilesDirectory, destinationTable) => {
    await importTilesDirectoryToTable(tilesDirectory, destinationTable);
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
  .command('data:import')
  .description('Import data based on type')
  .argument('<type>', `Type of data you want to import - ${Object.keys(dataImportAdapters).join(', ')}`)
  .option('--file <FILE>', 'Path to the file to import', '')
  .action(async (type, options) => {
    logger.info(`Importing data for ${type}`);
    const importer = dataImportManager(type as DataImportName);
    await importer.importData(options.file);
  });

program
  .command('tiles:generate-geojson')
  .description('Generate GeoJSON file for a given resource')
  .argument('<type>', `Type of resource you want to generate for - ${Object.keys(tilesAdapters).join(', ')}`)
  .option('--file <file>', 'Path of the file to export to', '')
  .action(async (type, options) => {
    logger.info(`Generating GeoJSON file for ${type}`);
    const tileManager = tilesManager(type as TilesName);

    const filepath = await tileManager.generateGeoJSON(options.file);
    console.info(`GeoJSON generated in ${filepath}`);
  });

program
  .command('tiles:import-geojson-legacy')
  .description(
    "Génère des tuiles vectorielles à partir d'un fichier GeoJSON et les enregistre dans postgres. Exemple : `yarn cli tiles:import-geojson-legacy reseaux_de_chaleur.geojson reseaux_de_chaleur_tiles 0 14`"
  )
  .argument('<fileName>', 'input file (format GeoJSON)')
  .argument('<destinationTable>', 'Destination table')
  .argument('[zoomMin]', 'Minimum zoom', (v) => parseInt(v), 0)
  .argument('[zoomMax]', 'Maximum zoom', (v) => parseInt(v), 17)
  .action(async (fileName, destinationTable, zoomMin, zoomMax) => {
    await importGeoJSONToTable(fileName, destinationTable, zoomMin, zoomMax);
  });

program
  .command('tiles:import-geojson')
  .description(
    "Génère des tuiles vectorielles à partir d'un fichier GeoJSON et les enregistre dans postgres. Exemple : `yarn cli tiles:import-geojson etudes-en-cours etude_en_cours.geojson`"
  )
  .argument('<type>', `Type of resource you want to generate for - ${Object.keys(tilesAdapters).join(', ')}`)
  .argument('<file>', 'Path of the GeoJSON file')
  .action(async (type, file) => {
    const tileManager = tilesManager(type as TilesName);
    const tilesDatabaseName = await tileManager.importGeoJSON(file);
    logger.info(`Imported GeoJSON ${file} to ${tilesDatabaseName}`);
  });

program
  .command('tiles:generate')
  .description(
    "Génère des tuiles vectorielles à partir d'une ressource en passant par un fichier GeoJSON temporaire. Exemple : `yarn cli tiles:generate reseaux_de_chaleur`"
  )
  .argument('<type>', `Type de ressource à générer - ${Object.keys(tilesAdapters).join(', ')}`)
  .action(async (type) => {
    logger.info(`Génération du fichier GeoJSON pour ${type}`);
    const tileManager = tilesManager(type as TilesName);

    const filepath = await tileManager.generateGeoJSON();

    if (!filepath) {
      throw new Error('Le fichier GeoJSON n’a pas été généré.');
    }

    logger.info(`GeoJSON généré: ${filepath}`);

    const tilesDatabaseName = `${tileManager.databaseName}_tiles`;

    logger.info(`Importation dans la table: ${tilesDatabaseName}`);
    await tileManager.importGeoJSON(filepath);

    logger.info(`Suppression du fichier temporaire ${filepath}`);
    await unlink(filepath);

    logger.info(`La table ${tilesDatabaseName} a été populée avec les données pour ${type}.`);
    logger.warn(`N’oubliez pas de copier la table sur dev et prod`);
    logger.warn(`./scripts/copyLocalTableToRemote.sh dev ${tilesDatabaseName} --data-only`);
    logger.warn(`./scripts/copyLocalTableToRemote.sh prod ${tilesDatabaseName} --data-only`);
    logger.warn(`Puis de l'ajouter à la carte yarn cli tiles:add-to-map ${type}`);
  });

program
  .command('tiles:add-to-map')
  .description('Quand les tiles sont en BDD, il faut les afficher sur la carte. Voici une description des actions à faire')
  .argument('<type>', `Type de ressource à générer - ${Object.keys(tilesAdapters).join(', ')}`)
  .action(async (type) => {
    logger.info(
      `Plusieurs actions manuelles à faire pour générer la couche ${type}. Vous pouvez voir https://github.com/betagouv/france-chaleur-urbaine/pull/991/files pour référence`
    );

    const typeCamelCase = camelcase(type);
    const layerFilePath = `src/components/Map/layers/${typeCamelCase}.tsx`;
    const mapConfigurationFilePath = `src/components/Map/map-configuration.ts`;
    const mapLayersFilePath = `src/components/Map/map-layers.ts`;
    const mapFilePath = `src/pages/carte.tsx`;
    const tilesConfigFilePath = `src/server/services/tiles.config.ts`;
    const analyticsFilePath = `src/services/analytics.ts`;
    const simpleMapLegendFilePath = `src/components/Map/components/SimpleMapLegend.tsx`;
    logger.info(`Dans ${mapConfigurationFilePath}`);
    logger.warn(`  🚧 Ajouter la config au type MapConfiguration -> "${typeCamelCase}: boolean"`);
    logger.warn(`  🚧 Ajouter la config à emptyMapConfiguration -> "${typeCamelCase}: false"`);
    logger.info(`Dans ${tilesConfigFilePath}`);
    logger.warn(`  🚧 Ajouter la config à databaseSourceIds -> "${typeCamelCase}"`);
    logger.warn(`  🚧 Ajouter la config à tilesInfo`);
    logger.info(`Dans ${layerFilePath}`);
    if (!existsSync(layerFilePath)) {
      await writeFile(
        layerFilePath,
        `// Check in other layers for the structure
    export const ${typeCamelCase}VilleLayersSpec = [];`
      );
      logger.info(`✅ Fichier layer créé dans ${layerFilePath}`);
    }
    logger.warn(`  🚧 Modifier le fichier layer`);
    logger.info(`Dans ${mapLayersFilePath}`);
    logger.warn(`  🚧 Importer dans mapLayers -> "...${typeCamelCase}LayersSpec,"`);
    logger.info(`Dans ${mapFilePath}`);
    logger.warn(`  🚧 Ajouter la config à layerURLKeysToMapConfigPath -> "${typeCamelCase}: '${typeCamelCase}.show'"`);
    logger.info(`Dans ${analyticsFilePath}`);
    logger.warn(`  🚧 Ajouter les events analytics`);
    logger.info(`Dans ${simpleMapLegendFilePath}`);
    logger.warn(`  🚧 Ajouter une nouvelle checkbox`);
    logger.info('');
    logger.info('Pour ouvrir tous les fichiers, vous pouvez faire :');
    logger.info(
      `code ${[layerFilePath, mapConfigurationFilePath, mapLayersFilePath, mapFilePath, tilesConfigFilePath, analyticsFilePath].join(' ')}`
    );
  });

program
  .command('opendata:create-archive')
  .description(
    "Cette commande permet de générer l'archive OpenData contenant les données de France Chaleur Urbaine au format Shapefile et GeoJSON. L'archive générée devra être envoyée à Florence en vue d'un dépôt sur la plateforme data.gouv.fr"
  )
  .action(async () => {
    await runCommand('scripts/opendata/create-opendata-archive.sh');
  });

program
  .command('reseaux:update-geom')
  .description("Met à jour la géométrie d'un réseau. La géométrie peut être en WGS 84 (4326) ou Lambert 93 (2154)")
  .argument('<fileName>', 'input file (format GeoJSON)')
  .argument('<id_fcu_or_sncu>', 'id_fcu ou SNCU du réseau')
  .action(async (fileName, id_fcu_or_sncu) => {
    const { geom, srid } = await readFileGeometry(fileName);

    // Vérifier si le paramètre est un nombre (id_fcu) ou une chaîne (identifiant reseau)
    const isIdSNCU = id_fcu_or_sncu.endsWith('C');

    // Vérifier si le réseau existe
    const existingNetwork = await kdb
      .selectFrom('reseaux_de_chaleur')
      .select('id_fcu')
      .where(isIdSNCU ? 'Identifiant reseau' : 'id_fcu', '=', isIdSNCU ? id_fcu_or_sncu : parseInt(id_fcu_or_sncu))
      .executeTakeFirst();

    if (!existingNetwork) {
      throw new Error(`Aucun réseau trouvé avec ${isIdSNCU ? 'identifiant reseau' : 'id_fcu'} = ${id_fcu_or_sncu}`);
    }

    await kdb
      .with('geometry', (db) =>
        db.selectNoFrom(
          srid === 4326
            ? sql<any>`st_transform(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
            : sql<any>`st_setsrid(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
        )
      )
      .updateTable('reseaux_de_chaleur')
      .where('id_fcu', '=', existingNetwork.id_fcu)
      .set({
        geom: (eb) => eb.selectFrom('geometry').select('geometry.geom'),
        has_trace: (eb) =>
          eb.selectFrom('geometry').select(sql<boolean>`st_geometrytype(geometry.geom) = 'ST_MultiLineString'`.as('has_trace')),
      })
      .execute();
  });
program
  .command('geo:merge-features')
  .description('Charge un fichier GeoJSON (FeatureCollection), agrège les géométries et écrit un nouveau fichier avec une géométrie unique')
  .argument('<fileName>', 'input file (format GeoJSON)')
  .action(async (fileName) => {
    // Lire le fichier GeoJSON
    const geoJson = JSON.parse(await readFile(fileName, 'utf8')) as GeoJSON.FeatureCollection;
    if (geoJson.type !== 'FeatureCollection') {
      throw new Error('Le fichier doit être une FeatureCollection GeoJSON');
    }

    console.info(`Fichier chargé: ${fileName} (${geoJson.features.length} features)`);

    // Extraire le SRID à partir de la première géométrie
    const srid = geoJson.features.length > 0 ? detectSrid(geoJson.features[0].geometry) : 4326;

    // Utiliser Kysely pour agréger les géométries
    const result = await kdb
      .with('features', (db) => {
        const featuresJson = JSON.stringify(geoJson.features);
        return db.selectNoFrom(sql<any>`jsonb_array_elements(${featuresJson}::jsonb)`.as('feature'));
      })
      .with('geometries', (db) =>
        db
          .selectFrom('features')
          .select(
            srid === 4326
              ? sql<any>`st_transform(ST_GeomFromGeoJSON(features.feature->>'geometry'), 2154)`.as('geom')
              : sql<any>`st_setsrid(ST_GeomFromGeoJSON(features.feature->>'geometry'), 2154)`.as('geom')
          )
      )
      .with('merged', (db) => db.selectFrom('geometries').select(sql<any>`st_multi(st_union(array_agg(geom)))`.as('merged_geom')))
      .selectFrom('merged')
      .select(sql<string>`st_asgeojson(st_transform(merged.merged_geom, 4326))`.as('geojson'))
      .executeTakeFirstOrThrow();

    // Créer un nouveau GeoJSON avec la géométrie fusionnée
    const mergedGeometry = JSON.parse(result.geojson) as GeoJSON.Geometry;
    const mergedGeoJson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: mergedGeometry,
        },
      ],
    };

    // Générer le fichier de sortie
    const outputFileName = fileName.replace(/\.geojson$/i, '_single.geojson');
    await writeFile(outputFileName, JSON.stringify(mergedGeoJson, null, 2), 'utf8');
    console.info(`Géométrie fusionnée écrite dans: ${outputFileName}`);
  });

program
  .command('reseaux:insert-geom')
  .description(
    'Insère un nouveau réseau (avoir créé le réseau sur airtable au préalable) avec une géométrie. La géométrie peut être en WGS 84 (4326) ou Lambert 93 (2154)'
  )
  .argument('<fileName>', 'input file (format GeoJSON)')
  .argument('<id_fcu>', 'id_fcu du réseau', (v) => parseInt(v))
  .argument('[id_sncu]', 'Identifiant du réseau')
  .action(async (fileName, id_fcu, id_sncu) => {
    const { geom, srid } = await readFileGeometry(fileName);
    await kdb
      .with('geometry', (db) =>
        db.selectNoFrom(
          srid === 4326
            ? sql<any>`st_transform(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
            : sql<any>`st_setsrid(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
        )
      )
      .insertInto('reseaux_de_chaleur')
      .columns(['id_fcu', 'Identifiant reseau', 'geom', 'has_trace', 'communes', 'reseaux classes', 'reseaux_techniques', 'fichiers'])
      .expression((eb) =>
        eb
          .selectFrom('geometry')
          .select((eb) => [
            eb.lit(id_fcu).as('id_fcu'),
            sql<string | null>`${id_sncu || null}`.as('Identifiant reseau'),
            'geometry.geom',
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
  .command('reseaux-froid:insert-geom')
  .description(
    'Insère un nouveau réseau (avoir créé le réseau sur airtable au préalable) avec une géométrie. La géométrie peut être en WGS 84 (4326) ou Lambert 93 (2154)'
  )
  .argument('<fileName>', 'input file (format GeoJSON)')
  .argument('<id_fcu>', 'id_fcu du réseau', (v) => parseInt(v))
  .action(async (fileName, id_fcu) => {
    const { geom, srid } = await readFileGeometry(fileName);
    await kdb
      .with('geometry', (db) =>
        db.selectNoFrom(
          srid === 4326
            ? sql<any>`st_transform(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
            : sql<any>`st_setsrid(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
        )
      )
      .insertInto('reseaux_de_froid')
      .columns(['id_fcu', 'geom', 'has_trace', 'communes', 'reseaux classes', 'fichiers'])
      .expression((eb) =>
        eb
          .selectFrom('geometry')
          .select((eb) => [
            eb.lit(id_fcu).as('id_fcu'),
            'geometry.geom',
            sql<boolean>`st_geometrytype(geometry.geom) = 'ST_MultiLineString'`.as('has_trace'),
            eb.val([]).as('communes'),
            eb.lit(false).as('reseaux classes'),
            eb.val([]).as('fichiers'),
          ])
      )
      .execute();
  });

program
  .command('pdp:create')
  .description('Insère un nouveau PDP avec une géométrie. La géométrie peut être en WGS 84 (4326) ou Lambert 93 (2154)')
  .argument('<fileName>', 'input file (format GeoJSON)')
  .argument('[id_sncu]', 'ID SNCU (identifiant réseau)')
  .action(async (fileName, id_sncu) => {
    const { geom, srid } = await readFileGeometry(fileName);

    const inserted = await kdb
      .with('geometry', (db) =>
        db.selectNoFrom(
          srid === 4326
            ? sql<any>`st_transform(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
            : sql<any>`st_setsrid(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
        )
      )
      .insertInto('zone_de_developpement_prioritaire')
      .values((eb) => ({
        id_fcu: sql<number>`(SELECT max(id_fcu) + 1 FROM zone_de_developpement_prioritaire)`,
        geom: eb.selectFrom('geometry').select('geometry.geom'),
        'Identifiant reseau': id_sncu,
        communes: sql<string[]>`COALESCE(
          (
            SELECT array_agg(nom order by nom)
            FROM geometry
            JOIN ign_communes on ST_Intersects(geometry.geom, st_buffer(ign_communes.geom, -150))
          ),
          (
            SELECT array_agg(nom order by nom)
            FROM geometry
            JOIN ign_communes on ST_Intersects(geometry.geom, ign_communes.geom)
          )
        )::text[]`,
      }))
      .returning('id_fcu')
      .executeTakeFirstOrThrow();

    console.info('PDP créé:', inserted.id_fcu);

    if (id_sncu) {
      const res = await kdb
        .updateTable('reseaux_de_chaleur')
        .where('Identifiant reseau', '=', id_sncu)
        .set({
          has_PDP: true,
        })
        .returning('id_fcu')
        .executeTakeFirstOrThrow();
      console.info('Réseau de chaleur mis à jour (has_PDP):', res.id_fcu);
    }
  });

program
  .command('pdp:update')
  .description("Met à jour la géométrie d'un PDP. La géométrie peut être en WGS 84 (4326) ou Lambert 93 (2154)")
  .argument('<fileName>', 'input file (format GeoJSON)')
  .argument('<id_fcu_or_sncu>', 'id_fcu ou identifiant réseau')
  .action(async (fileName, id_fcu_or_sncu) => {
    const { geom, srid } = await readFileGeometry(fileName);

    // Vérifier si le paramètre est un nombre (id_fcu) ou une chaîne (identifiant reseau)
    const isIdSNCU = id_fcu_or_sncu.endsWith('C');

    const existingPDP = await kdb
      .selectFrom('zone_de_developpement_prioritaire')
      .select('id_fcu')
      .where(isIdSNCU ? 'Identifiant reseau' : 'id_fcu', '=', isIdSNCU ? id_fcu_or_sncu : parseInt(id_fcu_or_sncu))
      .executeTakeFirst();

    if (!existingPDP) {
      throw new Error(`Aucun PDP trouvé avec ${isIdSNCU ? 'identifiant reseau' : 'id_fcu'} = ${id_fcu_or_sncu}`);
    }

    await kdb
      .with('geometry', (db) =>
        db.selectNoFrom(
          srid === 4326
            ? sql<any>`st_transform(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
            : sql<any>`st_setsrid(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`.as('geom')
        )
      )
      .updateTable('zone_de_developpement_prioritaire')
      .where('id_fcu', '=', existingPDP.id_fcu)
      .set({
        geom: (eb) => eb.selectFrom('geometry').select('geometry.geom'),
        communes: sql<string[]>`COALESCE(
          (
            SELECT array_agg(nom order by nom)
            FROM geometry
            JOIN ign_communes on ST_Intersects(geometry.geom, st_buffer(ign_communes.geom, -150))
          ),
          (
            SELECT array_agg(nom order by nom)
            FROM geometry
            JOIN ign_communes on ST_Intersects(geometry.geom, ign_communes.geom)
          )
        )::text[]`,
      })
      .execute();
  });

program
  .command('pdp:create-commune')
  .description("Insère un nouveau PDP avec une géométrie à partir d'une commune")
  .argument('<commune>', 'nom de la commune')
  .argument('[id_sncu]', 'ID SNCU (identifiant réseau)')
  .action(async (commune, id_sncu) => {
    // check if it exists
    if (!(await kdb.selectFrom('ign_communes').select('id').where('nom', 'ilike', commune).executeTakeFirst())) {
      throw new Error(`La commune ${commune} n'a pas été trouvée`);
    }

    const inserted = await kdb
      .with('geometry', (db) => db.selectFrom('ign_communes').select('geom').where('nom', 'ilike', commune))
      .insertInto('zone_de_developpement_prioritaire')
      .values((eb) => ({
        id_fcu: sql<number>`(SELECT max(id_fcu) + 1 FROM zone_de_developpement_prioritaire)`,
        geom: eb.selectFrom('geometry').select('geometry.geom'),
        'Identifiant reseau': id_sncu,
        communes: sql<string[]>`COALESCE(
          (
            SELECT array_agg(nom order by nom)
            FROM geometry
            JOIN ign_communes on ST_Intersects(geometry.geom, st_buffer(ign_communes.geom, -150))
          ),
          (
            SELECT array_agg(nom order by nom)
            FROM geometry
            JOIN ign_communes on ST_Intersects(geometry.geom, ign_communes.geom)
          )
        )::text[]`,
      }))
      .returning('id_fcu')
      .executeTakeFirstOrThrow();

    console.info('PDP créé:', inserted.id_fcu);

    if (id_sncu) {
      const res = await kdb
        .updateTable('reseaux_de_chaleur')
        .where('Identifiant reseau', '=', id_sncu)
        .set({
          has_PDP: true,
        })
        .returning('id_fcu')
        .executeTakeFirstOrThrow();
      console.info('Réseau de chaleur mis à jour (has_PDP):', res.id_fcu);
    }
  });

program
  .command('communes:search')
  .description('Recherche une commune dans la table ign_communes')
  .argument('<commune>', 'nom de la commune')
  .action(async (commune) => {
    const res = await kdb
      .selectFrom('ign_communes')
      .select(['insee_com', 'nom'])
      .where((eb) => eb(eb.fn('unaccent', ['nom']), 'ilike', sql`unaccent('%' || ${commune} || '%')`))
      .orderBy('insee_com')
      .execute();
    if (res.length === 0) {
      console.info(`Aucun résultat`);
      return;
    }
    console.info(`${res.length} résultats:`);
    console.info('Code INSEE - Nom');
    console.info(res.map((r) => `- ${r.insee_com}  -  ${r.nom}`).join('\n'));
  });

program
  .command('reseaux:update-communes')
  .description("Met à jour les communes des réseaux de chaleur / froid / en construction, pdp grâce aux coutours des communes de l'IGN.")
  .action(async () => {
    const tables = [
      'reseaux_de_chaleur',
      'reseaux_de_froid',
      'zones_et_reseaux_en_construction',
      'zone_de_developpement_prioritaire',
    ] satisfies ReadonlyArray<keyof DB>;

    const updateTableCommunes = (table: keyof DB) => sql`
      update ${sql.raw(table)}
      set communes = COALESCE(
        (
          SELECT array_agg(nom order by nom)
          FROM ign_communes
          WHERE ST_Intersects(${sql.raw(table)}.geom, st_buffer(ign_communes.geom, -150))
        ),
        (
          SELECT array_agg(nom order by nom)
          FROM ign_communes
          WHERE ST_Intersects(${sql.raw(table)}.geom, ign_communes.geom)
        ),
        '{}'
      )::text[]
    `;

    await Promise.all(
      tables.map(async (table) => {
        const res = await updateTableCommunes(table).execute(kdb);
        console.info(`Mise à jour de ${table}: ${res.numAffectedRows} lignes modifiées`);
      })
    );
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
  .command('jobs:start')
  .description('Start the jobs worker')
  .action(async () => {
    await processJobsIndefinitely();
  });

program
  .command('jobs:process')
  .description('Process a specific job by ID')
  .argument('<jobId>', 'Job ID to process')
  .action(async (jobId) => {
    await processJobById(jobId);
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

program
  .command('db:sync')
  .option('--single <table>', 'Print the table schema to stdout', '')
  .description('Génère les modèles TypeScript depuis la BDD')
  .action(async ({ single }) => {
    const patternOptions = single
      ? `--print --include-pattern="public.${single}"`
      : '--out-file ./src/server/db/kysely/database.ts --exclude-pattern="(public.spatial_ref_sys|topology.*|tiger.*|public.geography_columns|public.geometry_columns)"';
    await runBash(`yarn kysely-codegen --numeric-parser number --env-file="./.env.local" --log-level=error ${patternOptions}`);
    if (!single) {
      await runBash('yarn prettier --write ./src/server/db/kysely/database.ts');
    }
  });

program
  .command('image:optimize')
  .description(
    "Permet d'optimiser les images à introduire dans FCU, comme les infographies. Exemple : `yarn cli image:optimize infographie public/img/FCU_chiffres-cles_reseaux-chaleur.jpg`"
  )
  .argument('<profile>', 'optimization profile', (v) => z.enum(nonEmptyArray(optimisationProfiles)).parse(v))
  .argument('<fileName>', 'input image input file')
  .action(async (profile, fileName) => {
    await optimizeImage(fileName, profile);
  });

program
  .command('gitbook:import')
  .description('Etapes à suivre pour mettre à jour les actualités depuis GitBook')
  .action(async () => {
    console.info(`
      git fetch
      git checkout dev
      git pull --rebase
      git merge origin/feat/content
      echo "
      Etapes à réaliser :
      1. Vérifier et résoudre les conflits
      2. Ouvrir le fichier src/data/contents/index.ts, puis pour chaque article du ticket Trello :
        - Ajouter une section pour l'article
        - Référencer le contenu de l'article en l'important
        - Compléter :
          - l'image de couverture (visible dans le frontmatter de l'article)
          - titre (titre h1 du contenu),
          - slug (nom du fichier)
          - la date de publication (visible dans le ticket Trello)
          - les thèmes (visibles dans le ticket Trello)
      3. Supprimer le frontmatter des nouveaux articles avec ./scripts/clean-gitbook-actus.sh
    `);
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
  } finally {
    // disconnect from the database
    await Promise.all([db.destroy(), kdb.destroy()]);
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
