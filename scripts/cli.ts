import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

import { createCommand, InvalidArgumentError } from '@commander-js/extra-typings';
import { genSalt, hash } from 'bcryptjs';
import prompts from 'prompts';
import XLSX from 'xlsx';
import { z } from 'zod';

import { registerAppCommands } from '@/modules/app/commands';
import { processJobById, processJobsIndefinitely } from '@/modules/jobs/server/processor';
import { registerNetworkCommands } from '@/modules/reseaux/server/commands';
import { downloadAndUpdateNetwork, downloadNetwork } from '@/modules/reseaux/server/download-network';
import { applyGeometryUpdates } from '@/modules/reseaux/server/geometry-updates';
import { syncPostgresToAirtable } from '@/modules/reseaux/server/sync-pg-to-airtable';
import { createTilesCommands } from '@/modules/tiles/server/commands';
import { type DatabaseSourceId, tilesInfo } from '@/modules/tiles/tiles.config';
import { getApiHandler } from '@/server/api/users';
import { serverConfig } from '@/server/config';
import { saveStatsInDB } from '@/server/cron/saveStatsInDB';
import db from '@/server/db';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { syncComptesProFromUsers } from '@/server/services/airtable';
import { APIDataGouvService } from '@/services/api-data-gouv';
import { userRoles } from '@/types/enum/UserRole';
import { fetchJSON } from '@/utils/network';
import { runBash, runCommand } from '@/utils/system';
import { sleep } from '@/utils/time';
import { allDatabaseTables } from '@cli/bootstrap/tables';
import { refreshStatistics } from '@cli/stats/refresh';

import { type KnownAirtableBase, knownAirtableBases } from './airtable/bases';
import { createModificationsReseau } from './airtable/create-modifications-reseau';
import { fetchBaseSchema } from './airtable/dump-schema';
import dataImportManager, { dataImportAdapters, type DataImportName } from './data-import';
import { upsertFixedSimulateurData } from './simulateur/import';

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

program.addCommand(createTilesCommands());

program
  .command('opendata:create-archive')
  .description(
    "Cette commande permet de générer l'archive OpenData contenant les données de France Chaleur Urbaine au format Shapefile et GeoJSON. L'archive générée devra être envoyée à Florence en vue d'un dépôt sur la plateforme data.gouv.fr"
  )
  .action(async () => {
    await runCommand('scripts/opendata/create-opendata-archive.sh');
  });

program
  .command('opendata:publish')
  .description('Publie une archive OpenData sur data.gouv.fr dans le dataset des tracés des réseaux de chaleur et de froid')
  .argument('<archive-path>', 'Chemin vers le fichier archive (.zip) à publier')
  .option('--description <desc>', 'Description personnalisée pour la mise à jour')
  .action(async (archivePath, options) => {
    if (!existsSync(archivePath)) {
      logger.error(`Le fichier archive '${archivePath}' n'existe pas.`);
      process.exit(1);
    }

    logger.info(`Publication de l'archive '${archivePath}' sur data.gouv.fr...`);
    logger.info(`Dataset ID: ${serverConfig.DATA_GOUV_FR_DATASET_ID}`);

    const apiDataGouvService = new APIDataGouvService();
    await apiDataGouvService.publishOpendataArchive(
      archivePath,
      `Mise à jour du ${new Date().toLocaleDateString('fr-FR')} : ${options.description ?? 'ajout et actualisation de tracés'}`
    );

    logger.info('✅ Publication réussie !');
    logger.info(`URL du dataset: https://www.data.gouv.fr/datasets/${serverConfig.DATA_GOUV_FR_DATASET_ID}/`);
  });

registerAppCommands(program);
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
  .command('stats:refresh')
  .description('Refresh the statistics')
  .action(async () => {
    await refreshStatistics();
  });

program
  .command('debug:upsert-users-from-api')
  .description('Update Gestionnaires and Gestionnaires API airtables from file.')
  .argument('<accountName>', 'Name of the account in api_accounts')
  .argument('<file>', 'File with data')
  .action(async (accountName, file) => {
    const account = await kdb.selectFrom('api_accounts').where('name', '=', accountName).selectAll().executeTakeFirst();

    if (!account) {
      logger.error(`Account ${accountName} not found`);
      process.exit(1);
    }

    const data = JSON.parse(await readFile(file, 'utf8'));

    if (!process.env.DRY_RUN) {
      logger.info('');
      logger.info('USAGE:');
      logger.info('⚠️ DRY_RUN is not set, use DRY_RUN=<true|false> pnpm cli debug:upsert-users-from-api ...');
      process.exit(1);
    }

    const apiHandler = getApiHandler(account);
    await apiHandler.handleData(data);
  });

program
  .command('users:add')
  .description('Add a new user')
  .argument('<email>', 'Email of the user', (v) => z.email().parse(v))
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
      console.warn('Aucune table sélectionnée. Opération annulée.');
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
      4. Enfin, optimise les images avec pnpm image:optimize
    `);
  });

program
  .command('utils:geojson-to-ts')
  .description("Génère les types TypeScript à partir d'un fichier GeoJSON")
  .argument('<file>', 'Path to the GeoJSON file')
  .action(async (file) => {
    await runBash(`pnpx quicktype -l ts --prefer-unions --prefer-types --prefer-const-values -o types.ts "${file}"`);
  });

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, async () => {
    logger.warn('Received stop signal');
    process.exit(2);
  });
});

void (async () => {
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
