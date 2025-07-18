import { existsSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';

import { createCommand, InvalidArgumentError } from '@commander-js/extra-typings';
import { genSalt, hash } from 'bcryptjs';
import camelcase from 'camelcase';
import prompts from 'prompts';
import XLSX from 'xlsx';
import { z } from 'zod';

import { saveStatsInDB } from '@/server/cron/saveStatsInDB';
import db from '@/server/db';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import {
  type ApiNetwork,
  createGestionnairesFromAPI,
  deactivateUsersDeletedInAirtable,
  syncComptesProFromUsers,
  syncGestionnairesWithUsers,
  syncLastConnectionFromUsers,
} from '@/server/services/airtable';
import { processJobById, processJobsIndefinitely } from '@/server/services/jobs/processor';
import { type DatabaseSourceId, type DatabaseTileInfo, tilesInfo, zDatabaseSourceId } from '@/server/services/tiles.config';
import { type ApiAccount } from '@/types/ApiAccount';
import { userRoles } from '@/types/enum/UserRole';
import { fetchJSON } from '@/utils/network';
import { sleep } from '@/utils/time';
import { nonEmptyArray } from '@/utils/typescript';
import { allDatabaseTables } from '@cli/bootstrap/tables';
import { optimisationProfiles, optimizeImage } from '@cli/images/optimize';
import { registerNetworkCommands } from '@cli/networks/commands';
import { applyGeometryUpdates } from '@cli/networks/geometry-updates';
import { syncPostgresToAirtable } from '@cli/networks/sync-pg-to-airtable';

import { type KnownAirtableBase, knownAirtableBases } from './airtable/bases';
import { createModificationsReseau } from './airtable/create-modifications-reseau';
import { fetchBaseSchema } from './airtable/dump-schema';
import dataImportManager, { dataImportAdapters, type DataImportName } from './data-import';
import { runBash, runCommand } from './helpers/shell';
import { downloadAndUpdateNetwork, downloadNetwork } from './networks/download-network';
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
    'Importe en base une arborescence de tuiles vectorielles. A utiliser typiquement après avoir utilisé tippecanoe. Exemple : `pnpm cli tiles:import-mvt-directory tiles/zone_a_potentiel_fort_chaud zone_a_potentiel_fort_chaud_tiles`'
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

type EPCI = {
  code: string;
  nom: string;
  type: string;
  modeFinancement: string;
  populationTotale: number;
  populationMunicipale: number;
  membres: {
    code: string;
    siren: string;
    nom: string;
    populationTotale: number;
    populationMunicipale: number;
  }[];
};

program
  .command('import:epci')
  .description('Import the french EPCI (used for tags)')
  .action(async () => {
    const allEPCI = await fetchJSON<EPCI[]>('https://unpkg.com/@etalab/decoupage-administratif@5.2.0/data/epci.json');
    const epci = allEPCI
      // seules les communautés d'agglomération, les communautés urbaines et les métropoles sont intéressantes pour le moment
      .filter((epci) => ['CA', 'CU', 'METRO', 'MET69'].includes(epci.type))
      .map((metropole) => ({
        code: metropole.code,
        nom: metropole.nom,
        type: metropole.type,
        membres: JSON.stringify(metropole.membres.map((membre) => ({ code: membre.code, nom: membre.nom }))),
      }));

    await kdb.transaction().execute(async (tx) => {
      await tx.deleteFrom('epci').execute();
      await tx.insertInto('epci').values(epci).execute();
    });
    console.info(`${epci.length} EPCI importés`);
  });

type EPT = {
  code: string;
  nom: string;
  type: string;
  modeFinancement: string;
  populationTotale: number;
  populationMunicipale: number;
  membres: {
    code: string;
    siren: string;
    nom: string;
    populationTotale: number;
    populationMunicipale: number;
  }[];
};

program
  .command('import:ept')
  .description('Import the french EPT (Établissements Publics Territoriaux) (used for dynamic rules)')
  .action(async () => {
    const allEPT = await fetchJSON<EPT[]>('https://unpkg.com/@etalab/decoupage-administratif@5.2.0/data/ept.json');
    const ept = allEPT.map((etablissement) => ({
      code: etablissement.code,
      nom: etablissement.nom,
      type: etablissement.type,
      membres: JSON.stringify(etablissement.membres.map((membre) => ({ code: membre.code, nom: membre.nom }))),
    }));

    await kdb.transaction().execute(async (tx) => {
      await tx.deleteFrom('ept').execute();
      await tx.insertInto('ept').values(ept).execute();
    });
    console.info(`${ept.length} EPT importés`);
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
    "Génère des tuiles vectorielles à partir d'un fichier GeoJSON et les enregistre dans postgres. Exemple : `pnpm cli tiles:import-geojson-legacy reseaux_de_chaleur.geojson reseaux_de_chaleur_tiles 0 14`"
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
    "Génère des tuiles vectorielles à partir d'un fichier GeoJSON et les enregistre dans postgres. Exemple : `pnpm cli tiles:import-geojson etudes-en-cours etude_en_cours.geojson`"
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
    "Génère des tuiles vectorielles à partir d'une ressource en passant par un fichier GeoJSON temporaire. Exemple : `pnpm cli tiles:generate reseaux_de_chaleur`"
  )
  .argument('<type>', `Type de ressource à générer - ${Object.keys(tilesAdapters).join(', ')}`)
  .action(async (type) => {
    logger.info(`Génération du fichier GeoJSON pour ${type}`);
    const tileManager = tilesManager(type as TilesName);

    const filepath = await tileManager.generateGeoJSON();

    if (!filepath) {
      throw new Error("Le fichier GeoJSON n'a pas été généré.");
    }

    logger.info(`GeoJSON généré: ${filepath}`);

    const tilesDatabaseName = `${tileManager.databaseName}_tiles`;

    logger.info(`Importation dans la table: ${tilesDatabaseName}`);
    await tileManager.importGeoJSON(filepath);

    logger.info(`Suppression du fichier temporaire ${filepath}`);
    await unlink(filepath);

    logger.info(`La table ${tilesDatabaseName} a été populée avec les données pour ${type}.`);
    logger.warn(`N'oubliez pas`);
    logger.warn(`- de l'ajouter à la carte pnpm cli tiles:add-to-map ${type}`);
    logger.warn(`- de copier la table sur dev et prod`);
    logger.warn(`pnpm db:push:dev --data-only ${tilesDatabaseName}`);
    logger.warn(`pnpm db:push:prod --data-only ${tilesDatabaseName}`);
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

registerNetworkCommands(program);

program
  .command('communes:search')
  .description('Recherche une commune dans la table ign_communes')
  .argument('<commune>', 'nom de la commune')
  .action(async (commune) => {
    const res = await kdb
      .selectFrom('ign_communes')
      .select(['insee_com', 'nom'])
      .where((eb) => eb(eb.fn('immutable_unaccent', ['nom']), 'ilike', sql`immutable_unaccent('%' || ${commune} || '%')`))
      .orderBy('insee_com')
      .execute();
    if (res.length === 0) {
      logger.info(`Aucun résultat`);
      return;
    }
    logger.info(`${res.length} résultats:`);
    logger.info('Code INSEE | Nom');
    logger.info('-----------|------------------');
    res.forEach((r) => logger.info(`${r.insee_com?.padEnd(10)} | ${r.nom}`));
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

type XlsxRow = {
  tag: string;
  id_sncu?: string;
  id_fcu?: string;
  id_fcu_futur?: string;
};

type Output = {
  [id: string]: string[];
};

program
  .command('import:tags-reseaux')
  .description('Importe les tags des réseaux de chaleur et en construction depuis un fichier CSV')
  .argument('<file>', 'Path to the XLSX file')
  .action(async (file) => {
    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: XlsxRow[] = XLSX.utils.sheet_to_json(sheet, {
      header: ['tag', 'id_sncu', 'id_fcu', 'id_fcu_futur'],
      raw: false,
      defval: null,
      range: 1, // Skip header row
    });

    const tagsByIDSNCU = data.reduce<Output>((acc, { tag, id_sncu }) => {
      if (id_sncu) {
        const ids = id_sncu
          .replaceAll('.', ',')
          .split(',')
          .map((id) => id.trim());
        ids.forEach((id) => {
          if (!acc[id]) acc[id] = [];
          acc[id].push(tag);
        });
      }
      return acc;
    }, {});

    const tagsByIDFCU = data.reduce<Output>((acc, { tag, id_fcu }) => {
      if (id_fcu) {
        const ids = id_fcu
          .replaceAll('.', ',')
          .split(',')
          .map((id) => id.trim());
        ids.forEach((id) => {
          if (!acc[id]) acc[id] = [];
          acc[id].push(tag);
        });
      }
      return acc;
    }, {});

    const tagsByIDFCUFutur = data.reduce<Output>((acc, { tag, id_fcu_futur }) => {
      if (id_fcu_futur) {
        const ids = id_fcu_futur
          .replaceAll('.', ',')
          .split(',')
          .map((id) => id.trim());
        ids.forEach((id) => {
          if (!acc[id]) acc[id] = [];
          acc[id].push(tag);
        });
      }
      return acc;
    }, {});

    // maj réseaux de chaleur selon id sncu
    for (const [id_sncu, tags] of Object.entries(tagsByIDSNCU)) {
      await kdb.updateTable('reseaux_de_chaleur').set({ tags }).where('Identifiant reseau', '=', id_sncu).execute();
    }

    // maj réseaux de chaleur selon id fcu
    for (const [id_fcu, tags] of Object.entries(tagsByIDFCU)) {
      await kdb.updateTable('reseaux_de_chaleur').set({ tags }).where('id_fcu', '=', parseInt(id_fcu)).execute();
    }

    // maj réseaux en construction selon id fcu
    for (const [id_fcu_futur, tags] of Object.entries(tagsByIDFCUFutur)) {
      await kdb.updateTable('zones_et_reseaux_en_construction').set({ tags }).where('id_fcu', '=', parseInt(id_fcu_futur)).execute();
    }
    console.info('Tags importés avec succès');
  });

program
  .command('update-simulateur')
  .description('Take AMORCE file and either create records in database or update them.')
  .argument('<filepath>', 'Path to the Amorce file')
  .action(async (filepath) => {
    await upsertFixedSimulateurData(filepath);
  });

program
  .command('stats:update-monthly')
  .description('Update the table matomo_stats used by the stats page. Data come from Matomo and Airtable.')
  .argument('[start-date]', 'Format : YYYY-MM-DD')
  .argument('[end-date]', 'Format : YYYY-MM-DD')
  .action(async (startDate, endDate) => {
    if (!process.env.DRY_RUN) {
      logger.info('');
      logger.info('USAGE:');
      logger.info('⚠️ DRY_RUN is not set, use DRY_RUN=<true|false> pnpm cli stats:update-monthly ...');
      process.exit(1);
    }

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
      logger.info('⚠️ DRY_RUN is not set, use FIRST_TIME_FIX=<true|false> DRY_RUN=<true|false> pnpm cli debug:upsert-users-from-api ...');
      process.exit(1);
    }
    await createGestionnairesFromAPI(account, data);
  });

program
  .command('users:add')
  .description('Add a new user')
  .argument('<email>', 'Email of the user', (v) => z.string().email().parse(v))
  .argument('<password>', 'Password of the user')
  .argument('<role>', 'Role of the user', (v) => z.enum(userRoles).parse(v))
  .argument(
    '[tags_gestionnaires]',
    'Tags gestionnaires (gestionnaire only)',
    (v) => z.preprocess((v) => String(v).split(','), z.array(z.string())).parse(v),
    []
  )
  .action(async (email, password, role, tags_gestionnaires) => {
    const existingUser = await kdb.selectFrom('users').select('id').where('email', '=', email).executeTakeFirst();
    if (existingUser) {
      throw new Error(`L'utilisateur associé à l'email '${email}' existe déjà.`);
    }

    await kdb
      .insertInto('users')
      .values({
        email,
        password: await hash(password, await genSalt(10)),
        role,
        status: 'valid',
        gestionnaires: tags_gestionnaires,
      })
      .execute();
    logger.info(`Utilisateur ${email} créé avec succès.`);
  });

program
  .command('users:sync-from-airtable')
  .description('Sync users created in Airtable in PostGres.')
  .action(async () => {
    if (!process.env.DRY_RUN) {
      logger.info('');
      logger.info('USAGE:');
      logger.info('⚠️ DRY_RUN is not set, use DRY_RUN=<true|false> pnpm cli users:sync-from-airtable');
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
      logger.info('⚠️ DRY_RUN is not set, use DRY_RUN=<true|false> pnpm cli users:sync-last-connection-to-airtable');
      process.exit(1);
    }
    await syncLastConnectionFromUsers();
  });

program
  .command('users:sync-comptes-pro-to-airtable')
  .description('Sync users last connection from PostGres to Airtable.')
  .action(async () => {
    if (!process.env.DRY_RUN) {
      logger.info('');
      logger.info('USAGE:');
      logger.info('⚠️ DRY_RUN is not set, use DRY_RUN=<true|false> pnpm cli users:sync-last-connection-to-airtable');
      process.exit(1);
    }
    await syncComptesProFromUsers();
  });

program
  .command('users:deactivate-users-deleted-in-airtable')
  .description('Deactivate users which have been deleted in Airtable.')
  .action(async () => {
    if (!process.env.DRY_RUN) {
      logger.info('');
      logger.info('USAGE:');
      logger.info('⚠️ DRY_RUN is not set, use DRY_RUN=<true|false> pnpm cli users:deactivate-users-deleted-in-airtable');
      process.exit(1);
    }
    await deactivateUsersDeletedInAirtable();
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
  .command('db:bootstrap')
  .description('Initialise la base de données avec les tables depuis la production')
  .option('--sequential', 'Télécharge les tables une par une', false)
  .action(async ({ sequential }) => {
    const { selectedTables } = (await prompts({
      type: 'multiselect',
      name: 'selectedTables',
      message: 'Sélectionnez les tables à télécharger :',
      choices: allDatabaseTables.map((table) => ({
        title: `${table.name} - ${table.description}`,
        value: table.name,
        selected: true,
      })),
      hint: '- Espace pour sélectionner/désélectionner, Entrée pour valider',
    })) as { selectedTables: string[] };

    if (!selectedTables || selectedTables.length === 0) {
      console.log('Aucune table sélectionnée. Opération annulée.');
      return;
    }

    if (sequential)
      for (const table of selectedTables) {
        await runBash(`pnpm db:pull:prod --data-only "${table}"`);
      }
    else {
      await runBash(`pnpm db:pull:prod --data-only ${selectedTables.map((t) => `"${t}"`).join(' ')}`);
    }
  });

program
  .command('db:sync')
  .option('--single <table>', 'Print the table schema to stdout', '')
  .description('Génère les modèles TypeScript depuis la BDD')
  .action(async ({ single }) => {
    const patternOptions = single
      ? `--print --include-pattern="public.${single}"`
      : '--out-file ./src/server/db/kysely/database.ts --exclude-pattern="(public.spatial_ref_sys|topology.*|tiger.*|public.geography_columns|public.geometry_columns)"';
    await runBash(`pnpm kysely-codegen --numeric-parser number --env-file="./.env.local" --log-level=error ${patternOptions}`);
    if (!single) {
      await runBash('pnpm prettier --write ./src/server/db/kysely/database.ts');
    }
  });

program
  .command('image:optimize')
  .description(
    "Permet d'optimiser les images à introduire dans FCU, comme les infographies. Exemple : `pnpm cli image:optimize infographie public/img/FCU_chiffres-cles_reseaux-chaleur.jpg`"
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

      Etapes à réaliser :
      1. Vérifier et résoudre les conflits
        - Pour plus de facilité si vous utilisez un GUI git -> "git add . && git reset HEAD"

      2. Ouvrir le fichier src/data/contents/index.ts, puis entrer le prompt suivant :
        - Applique @import-gitbook.mdc <contenu du ticket Trello>

      Cela devrait :
        - Ajouter une section pour l'article
        - Référencer le contenu de l'article en l'important
        - Compléter :
          - l'image de couverture (visible dans le frontmatter de l'article)
          - titre (titre h1 du contenu),
          - slug (nom du fichier)
          - la date de publication (visible dans le ticket Trello)
          - les thèmes (visibles dans le ticket Trello)

      3. Enfin, supprime le frontmatter des nouveaux articles et les urls absolues avec ./scripts/clean-gitbook-actus.sh
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
