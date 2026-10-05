import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';

import { upsertSurveyDiscrepancyRequest } from '@/modules/network-change-requests/server/service';
import { isPrixReseauCommunique, normalizeNetworkValue } from '@/modules/reseaux/constants';
import { type DB, kdb, sql } from '@/server/db/kysely';
import type { Logger } from '@/server/helpers/logger';

import { defineFileImportFunc } from '../import';
import { loadXlsxFromFile } from '../import-utils';

// ---------------------------------------------------------------------------
// Constants + Types
// ---------------------------------------------------------------------------

export const FEDENE_EDITION_YEAR = 2025;
const EXCEL_SHEET_NAME = 'BDD - complète';

export type ExcelRowBrute = {
  'ID EARCF': string;
  Commune: string | null;
  Nom: string;
  "Maitre d'Ouvrage": string | null;
  Gestionnaire: string | null;
  'Groupe gestionnaire': string | null;
  'Longueur du réseau km (aller)': string | null;
  'Nombre points de livraison': number | null;
  'Contenu CO₂ en kg CO₂ / kWh': number | null;
  'Contenu CO₂ ACV en kg CO₂ / kWh': number | null;
  'Taux EnR&R': number | null;
  'Année de référence du taux [2024 ou Moyenne 2022-2023-2024]': string | null;
  'Prod MWh GAZ_NATUREL': number | null;
  'Prod MWh CHARBON': number | null;
  'Prod MWh FIOUL_DOMESTIQUE': number | null;
  'Prod MWh FIOUL_LOURD': number | null;
  'Prod MWh GPL': number | null;
  'Prod MWh BIOMASSE_SOLIDE': number | null;
  'Prod MWh UVE interne': number | null;
  'Prod MWh UVE externe': number | null;
  'Prod MWh BIOGAZ': number | null;
  'Prod MWh GEOTHERMIE': number | null;
  'Prod MWh PAC': number | null;
  'Prod MWh SOLAIRE_THERMIQUE': number | null;
  'Prod MWh AUTRES_ENR dont GOB': number | null;
  'Prod MWh CHALEUR_INDUSTRIEL': number | null;
  'Prod MWh AUTRE_CHALEUR_RECUPEREE': number | null;
  'Prod MWh CHAUDIERES_ELECTRIQUES': number | null;
  'Prod MWh AUTRE': number | null;
  'Production totale MWh': number | null;
  'Livraisons nettes MWh': number | null;
  'Livraisons Résidentiel MWh': number | null;
  'Livraisons Tertiaire MWh': number | null;
  'Livraisons Industrie MWh': number | null;
  'Livraisons Agriculture MWh': number | null;
  'Livraisons Autre MWh': number | null;
  'Rendement de distribution': number | null;
  'Développement réseau': number | null;
  'Prix moyen \n€ TTC/MWh': number | null;
  'Part variable': number | null;
  'Part fixe': number | null;
  'Coût en € TTC/MWh \nRésidence 30 lots': number | null;
  'Coût en € TTC/MWh \nBâtiment tertiaire': number | null;
};

type NetworkTable = 'reseaux_de_chaleur' | 'reseaux_de_froid';
type NetworkType = 'reseau_de_chaleur' | 'reseau_de_froid';

/** Survey columns written on the network row (common to both tables). */
type CommonSurveyFields = Pick<
  DB['reseaux_de_froid'],
  | 'livraisons_autre_MWh'
  | 'livraisons_industrie_MWh'
  | 'livraisons_residentiel_MWh'
  | 'livraisons_tertiaire_MWh'
  | 'livraisons_totale_MWh'
  | 'nb_pdl'
  | 'production_totale_MWh'
  | 'Rend%'
>;
type ChaleurSurveyFields = CommonSurveyFields &
  Pick<
    DB['reseaux_de_chaleur'],
    | 'Dev_reseau%'
    | 'livraisons_agriculture_MWh'
    | 'PF%'
    | 'PM'
    | 'PM_L'
    | 'PM_T'
    | 'PV%'
    | 'prod_MWh_autre_chaleur_recuperee'
    | 'prod_MWh_autres'
    | 'prod_MWh_autres_ENR'
    | 'prod_MWh_biogaz'
    | 'prod_MWh_biomasse_solide'
    | 'prod_MWh_chaleur_industiel'
    | 'prod_MWh_charbon'
    | 'prod_MWh_chaudieres_electriques'
    | 'prod_MWh_dechets_internes'
    | 'prod_MWh_fioul_domestique'
    | 'prod_MWh_fioul_lourd'
    | 'prod_MWh_GPL'
    | 'prod_MWh_gaz_naturel'
    | 'prod_MWh_geothermie'
    | 'prod_MWh_PAC'
    | 'prod_MWh_solaire_thermique'
    | 'prod_MWh_UIOM'
  >;

/** Name, gestionnaire and MO reported by the survey: written on the `*_fedene` columns, the FCU corrections (`*_fcu`) stay. */
type SurveyIdentity = Pick<DB['reseaux_de_chaleur'], 'gestionnaire_fedene' | 'mo_fedene' | 'nom_reseau_fedene'>;

type FiliereConfig = {
  label: string;
  mapFields: (data: ExcelRowBrute) => Record<string, number | string | null>;
  networkType: NetworkType;
  sncuPattern: RegExp;
  table: NetworkTable;
};

type FieldDiff = { field: string; newValue: unknown; oldValue: unknown };
type ChangeEntry = { diffs: FieldDiff[]; id: string; type: 'UPDATE' | 'CREATE' };

export type FiliereResult = {
  changes: ChangeEntry[];
  createdCount: number;
  invalidIdsCount: number;
  missingFromExcel: string[];
  updatedCount: number;
};

// ---------------------------------------------------------------------------
// Filière configs
// ---------------------------------------------------------------------------

const FILIERE_CHALEUR: FiliereConfig = {
  label: 'chaleur',
  mapFields: mapFieldsChaleur,
  networkType: 'reseau_de_chaleur',
  sncuPattern: /^\d+C$/,
  table: 'reseaux_de_chaleur',
};

const FILIERE_FROID: FiliereConfig = {
  label: 'froid',
  mapFields: mapFieldsFroid,
  networkType: 'reseau_de_froid',
  sncuPattern: /^\d+F$/,
  table: 'reseaux_de_froid',
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Yearly import of the FEDENE library (Excel): survey figures are written on the heat and cold networks (keyed by SNCU id,
 * networks unknown to the base are created without geometry). The survey's name, gestionnaire and MO go to the `*_fedene`
 * columns; a FCU correction (`*_fcu`) is kept as is, cleared when the survey now matches it, and otherwise becomes a pending
 * « écart avec l'enquête » request proposing to drop the correction.
 */
export const importDonneesReseauxBibliothequeFedene = defineFileImportFunc(async ({ filepath, logger, options }) => {
  const dryRun = options?.dryRun ?? false;

  logger.info(`Début de l'import des données réseaux depuis le fichier Fedene (Edition ${FEDENE_EDITION_YEAR})`);
  logger.info(`Mode: ${dryRun ? 'dry-run' : 'live'}`);

  const rows = (await loadXlsxFromFile(filepath, EXCEL_SHEET_NAME)) as ExcelRowBrute[];
  logger.info(`${rows.length} lignes lues depuis le fichier Excel`);

  const results = await importFedeneRows(rows, { dryRun, logger });

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const logFilePath = `import-bibliotheque-fedene-${timestamp}.log`;
  const logStream = createWriteStream(logFilePath, { encoding: 'utf-8' });
  const log = (text: string) => logStream.write(`${text}\n`);
  log(`# Import Fedene Edition ${FEDENE_EDITION_YEAR} - ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  log(`Mode: ${dryRun ? 'dry-run' : 'live'}`);
  log('');
  writeLogSection(log, FILIERE_CHALEUR.label, results.chaleur);
  writeLogSection(log, FILIERE_FROID.label, results.froid);
  log('## Résumé');
  for (const [label, result] of [
    [FILIERE_CHALEUR.label, results.chaleur],
    [FILIERE_FROID.label, results.froid],
  ] as const) {
    log(`- Réseaux de ${label} mis à jour: ${result.changes.filter((change) => change.type === 'UPDATE').length}`);
    log(`- Réseaux de ${label} créés: ${result.createdCount}`);
    log(`- Réseaux de ${label} en base mais absents du fichier: ${result.missingFromExcel.length}`);
  }
  logStream.end();
  await finished(logStream);
  logger.info(`Fichier de log généré: ${logFilePath}`);
});

/** Applies the rows of the FEDENE file to the base (exported for tests: no file, no log file). */
export const importFedeneRows = async (rows: ExcelRowBrute[], { dryRun, logger }: { dryRun: boolean; logger: Logger }) => {
  const reseauxChaleur = rows.filter((row) => row['ID EARCF']?.endsWith('C'));
  const reseauxFroid = rows.filter((row) => row['ID EARCF']?.endsWith('F'));
  logger.info(`${reseauxChaleur.length} réseaux de chaleur, ${reseauxFroid.length} réseaux de froid`);

  const chaleur = await processFiliere(FILIERE_CHALEUR, reseauxChaleur, { dryRun });
  logFiliereConsoleOutput(logger, FILIERE_CHALEUR.label, chaleur);
  const froid = await processFiliere(FILIERE_FROID, reseauxFroid, { dryRun });
  logFiliereConsoleOutput(logger, FILIERE_FROID.label, froid);

  logger.info(
    `Import terminé: ${chaleur.updatedCount + froid.updatedCount} réseaux mis à jour, ${chaleur.createdCount + froid.createdCount} créés, ${chaleur.missingFromExcel.length + froid.missingFromExcel.length} absents du fichier`
  );
  return { chaleur, froid };
};

// ---------------------------------------------------------------------------
// Processing logic
// ---------------------------------------------------------------------------

async function processFiliere(config: FiliereConfig, reseaux: ExcelRowBrute[], { dryRun }: { dryRun: boolean }): Promise<FiliereResult> {
  const existingNetworks = await kdb
    .selectFrom(config.table)
    .select(['id_fcu', 'Identifiant reseau', 'gestionnaire_fcu', 'mo_fcu', 'nom_reseau_fcu'])
    .where('Identifiant reseau', 'is not', null)
    .execute();
  const idFcuBySncu = new Map(existingNetworks.map((network) => [network['Identifiant reseau'] as string, network.id_fcu]));
  const networkBySncu = new Map(existingNetworks.map((network) => [network['Identifiant reseau'] as string, network]));
  const sncuExcel = new Set(reseaux.map((row) => row['ID EARCF']));

  const changes: ChangeEntry[] = [];
  let updatedCount = 0;
  let createdCount = 0;
  // sequential: one network at a time keeps the log ordered and the diff readable
  for (const row of reseaux) {
    const sncu = row['ID EARCF'];
    const survey = mapSurveyIdentity(row);
    // an empty survey value keeps the previous one (and the FCU correction): the file is not always complete
    const fields = { ...config.mapFields(row), ...Object.fromEntries(Object.entries(survey).filter(([, value]) => value !== null)) };
    const idFcu = idFcuBySncu.get(sncu);
    if (idFcu !== undefined) {
      const diffs = await collectDiffs(config.table, idFcu, fields);
      if (diffs.length > 0) {
        changes.push({ diffs, id: sncu, type: 'UPDATE' });
      }
      updatedCount++;
      if (!dryRun) {
        const network = networkBySncu.get(sncu) as (typeof existingNetworks)[number];
        // a FCU correction now matched by the survey is dropped; one still differing is proposed for removal
        const corrections = [
          { fcu: network.gestionnaire_fcu, fcuColumn: 'gestionnaire_fcu', payloadKey: 'gestionnaire', survey: survey.gestionnaire_fedene },
          { fcu: network.mo_fcu, fcuColumn: 'mo_fcu', payloadKey: 'maitreOuvrage', survey: survey.mo_fedene },
          { fcu: network.nom_reseau_fcu, fcuColumn: 'nom_reseau_fcu', payloadKey: 'nomReseau', survey: survey.nom_reseau_fedene },
        ] as const;
        const matched = corrections.filter(
          ({ fcu, survey: surveyValue }) => fcu !== null && surveyValue !== null && !isDifferent(surveyValue, fcu)
        );
        await kdb
          .updateTable(config.table)
          .set({ ...fields, ...Object.fromEntries(matched.map(({ fcuColumn }) => [fcuColumn, null])) })
          .where('id_fcu', '=', idFcu)
          .execute();
        const displayedName = network.nom_reseau_fcu ?? survey.nom_reseau_fedene ?? '';
        await upsertSurveyDiscrepancyRequest(
          { id: idFcu, label: `${sncu} - ${displayedName}`.trim(), type: config.networkType },
          {
            edition: FEDENE_EDITION_YEAR,
            ...Object.fromEntries(
              corrections
                .filter(({ fcu, survey: surveyValue }) => fcu !== null && isDifferent(surveyValue, fcu))
                .map(({ payloadKey, survey: surveyValue }) => [payloadKey, surveyValue as string])
            ),
          }
        );
      }
      continue;
    }
    changes.push({ diffs: buildCreateDiffs(fields), id: sncu, type: 'CREATE' });
    createdCount++;
    if (!dryRun) {
      // a network known to the survey but not to the base: created without geometry (the trace comes later from the admin)
      await kdb
        .insertInto(config.table)
        .values({
          ...fields,
          'Identifiant reseau': sncu,
          id_fcu: sql<number>`(SELECT COALESCE(MAX(id_fcu), 0) + 1 FROM ${sql.table(config.table)})`,
          'reseaux classes': false,
          ...(config.table === 'reseaux_de_chaleur' ? { ouvert_aux_raccordements: false } : {}),
        })
        .execute();
    }
  }

  const missingFromExcel = [...idFcuBySncu.keys()].filter((sncu) => !sncuExcel.has(sncu) && config.sncuPattern.test(sncu));
  const invalidIdsCount = existingNetworks.filter((network) => !config.sncuPattern.test(network['Identifiant reseau'] ?? '')).length;

  return { changes, createdCount, invalidIdsCount, missingFromExcel, updatedCount };
}

/** A survey value counts as different only when it is filled and differs from the base value (case and whitespace ignored). */
const isDifferent = (surveyValue: string | null, baseValue: string | null) =>
  normalizeNetworkValue(surveyValue) !== '' && normalizeNetworkValue(surveyValue) !== normalizeNetworkValue(baseValue);

async function collectDiffs(table: NetworkTable, idFcu: number, fields: Record<string, number | string | null>): Promise<FieldDiff[]> {
  const columns = Object.keys(fields) as (keyof DB['reseaux_de_chaleur'])[];
  const current = await kdb
    .selectFrom(table)
    .select(columns as any)
    .where('id_fcu', '=', idFcu)
    .executeTakeFirstOrThrow();
  return Object.entries(fields)
    .map(([field, newValue]) => ({ field, newValue, oldValue: (current as Record<string, unknown>)[field] ?? null }))
    .filter(({ newValue, oldValue }) => oldValue !== newValue);
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function writeLogSection(log: (text: string) => void, label: string, { missingFromExcel, changes }: FiliereResult): void {
  if (changes.length > 0) {
    log(`## Détail des changements - Réseaux de ${label}`);
    log('');
    changes.forEach((change) => {
      log(formatChangeEntry(change));
      log('');
    });
  }
  if (missingFromExcel.length > 0) {
    log(`## Réseaux de ${label} en base mais absents du fichier`);
    log('');
    missingFromExcel.forEach((sncu) => log(`- ${sncu}`));
    log('');
  }
}

function logFiliereConsoleOutput(logger: Logger, label: string, result: FiliereResult): void {
  logger.info(
    `Réseaux de ${label}: ${result.updatedCount} mis à jour, ${result.createdCount} créés, ${result.missingFromExcel.length} absents du fichier`
  );
  if (result.invalidIdsCount > 0) {
    logger.warn(`${result.invalidIdsCount} réseaux de ${label} en base ont un identifiant SNCU invalide`);
  }
  const created = result.changes.filter((change) => change.type === 'CREATE').map((change) => change.id);
  if (created.length > 0) {
    console.log(`\nRéseaux de ${label} dans Excel mais absents de la base (${created.length}):`);
    console.log(created.sort().join('\n'));
  }
  if (result.missingFromExcel.length > 0) {
    console.log(`\nRéseaux de ${label} en base mais absents du fichier Excel (${result.missingFromExcel.length}):`);
    console.log(result.missingFromExcel.sort().join('\n'));
  }
}

function formatChangeEntry({ diffs, id, type }: ChangeEntry): string {
  return [
    `### ${id} - ${type}`,
    ...diffs.map((diff) => `  ${diff.field}: ${formatValue(diff.oldValue)} → ${formatValue(diff.newValue)}`),
  ].join('\n');
}

function formatValue(value: unknown): string {
  return value === null || value === undefined ? 'null' : typeof value === 'string' ? `"${value}"` : String(value);
}

function buildCreateDiffs(createData: Record<string, unknown>): FieldDiff[] {
  return Object.entries(createData).map(([field, newValue]) => ({ field, newValue: newValue ?? null, oldValue: null }));
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapSurveyIdentity(data: ExcelRowBrute): SurveyIdentity {
  return {
    gestionnaire_fedene: formatGestionnaire(data.Gestionnaire, data['Groupe gestionnaire']),
    mo_fedene: toStringOrNull(data["Maitre d'Ouvrage"]),
    nom_reseau_fedene: toStringOrNull(data.Nom),
  };
}

function mapCommonFields(data: ExcelRowBrute): CommonSurveyFields {
  return {
    livraisons_autre_MWh: data['Livraisons Autre MWh'],
    livraisons_industrie_MWh: data['Livraisons Industrie MWh'],
    livraisons_residentiel_MWh: data['Livraisons Résidentiel MWh'],
    livraisons_tertiaire_MWh: data['Livraisons Tertiaire MWh'],
    livraisons_totale_MWh: data['Livraisons nettes MWh'],
    nb_pdl: data['Nombre points de livraison'],
    production_totale_MWh: data['Production totale MWh'],
    'Rend%': ratioToPercent(data['Rendement de distribution']),
  };
}

function mapFieldsChaleur(data: ExcelRowBrute): ChaleurSurveyFields {
  return {
    ...mapCommonFields(data),
    'Dev_reseau%': ratioToPercent(data['Développement réseau']),
    livraisons_agriculture_MWh: data['Livraisons Agriculture MWh'],
    'PF%': ratioToPercent(toNumberOrNull(data['Part fixe'])),
    PM: toPriceOrNull(data['Prix moyen \n€ TTC/MWh']),
    PM_L: toPriceOrNull(data['Coût en € TTC/MWh \nRésidence 30 lots']),
    PM_T: toPriceOrNull(data['Coût en € TTC/MWh \nBâtiment tertiaire']),
    'PV%': ratioToPercent(toNumberOrNull(data['Part variable'])),
    prod_MWh_autre_chaleur_recuperee: data['Prod MWh AUTRE_CHALEUR_RECUPEREE'],
    prod_MWh_autres: data['Prod MWh AUTRE'],
    prod_MWh_autres_ENR: data['Prod MWh AUTRES_ENR dont GOB'],
    prod_MWh_biogaz: data['Prod MWh BIOGAZ'],
    prod_MWh_biomasse_solide: data['Prod MWh BIOMASSE_SOLIDE'],
    prod_MWh_chaleur_industiel: data['Prod MWh CHALEUR_INDUSTRIEL'],
    prod_MWh_charbon: data['Prod MWh CHARBON'],
    prod_MWh_chaudieres_electriques: data['Prod MWh CHAUDIERES_ELECTRIQUES'],
    prod_MWh_dechets_internes: data['Prod MWh UVE interne'],
    prod_MWh_fioul_domestique: data['Prod MWh FIOUL_DOMESTIQUE'],
    prod_MWh_fioul_lourd: data['Prod MWh FIOUL_LOURD'],
    prod_MWh_GPL: data['Prod MWh GPL'],
    prod_MWh_gaz_naturel: data['Prod MWh GAZ_NATUREL'],
    prod_MWh_geothermie: data['Prod MWh GEOTHERMIE'],
    prod_MWh_PAC: data['Prod MWh PAC'],
    prod_MWh_solaire_thermique: data['Prod MWh SOLAIRE_THERMIQUE'],
    prod_MWh_UIOM: data['Prod MWh UVE externe'],
  };
}

function mapFieldsFroid(data: ExcelRowBrute): CommonSurveyFields {
  return mapCommonFields(data);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Convert ratio (0.82) to percentage (82.0) rounded to 1 decimal */
function ratioToPercent(value: number | null): number | null {
  return value == null ? null : Math.round(value * 100 * 10) / 10;
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A price below the "communicated" threshold (0 €, cents) is normalized to null */
function toPriceOrNull(value: unknown): number | null {
  const price = toNumberOrNull(value);
  return isPrixReseauCommunique(price) ? price : null;
}

function toStringOrNull(value: unknown): string | null {
  return value != null ? String(value) : null;
}

function formatGestionnaire(gestionnaire: string | null, groupe: string | null): string | null {
  if (!gestionnaire) {
    return null;
  }
  return !groupe || gestionnaire.toLowerCase().includes(groupe.toLowerCase()) ? gestionnaire : `${gestionnaire} (${groupe})`;
}
