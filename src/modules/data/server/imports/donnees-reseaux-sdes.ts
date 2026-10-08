import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';

import { type DB, kdb } from '@/server/db/kysely';
import type { Logger } from '@/server/helpers/logger';
import { fetchJSON } from '@/utils/network';

import { defineImportFunc } from '../import';

const SDES_API_URL =
  'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/b0c273bb-1578-42f3-b22b-074d78de3ca3/json?millesime=2024-09';

/**
 * Données brutes de l'API SDES (millésime 2024)
 * Documentation : https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/b0c273bb-1578-42f3-b22b-074d78de3ca3
 *
 * Comme nous avons les données plus complètes dans la bibliothèque Fedene, nous importons uniquement les puissances via ces données.
 */
export type DonneesReseauBrutes = {
  // Identification
  ANNEE: string;
  COMMUNE_CODE: string;
  COMMUNE_LIBELLE: string;
  FILIERE: 'C' | 'F';
  ID: string;
  NCC: string;
  OPERATEUR: string;

  // Contenus CO2
  CONTENU_EN_CO2: number;
  CONTENU_EN_CO2_ACV: number;

  // Livraisons/Consommations (MWh) - peuvent contenir "secret"
  CONSOA: number | 'secret';
  CONSOI: number | 'secret';
  CONSONA: number | 'secret';
  CONSOR: number | 'secret';
  CONSOT: number | 'secret';
  CONSOTOT: number | 'secret';

  // Points de livraison - peut contenir "secret"
  PDL: number | 'secret';

  // Productions (MWh)
  PRODUCTION_AUTRE_CHALEUR_RECUPEREE: number;
  PRODUCTION_AUTRES: number;
  PRODUCTION_AUTRES_ENR: number;
  PRODUCTION_BIOGAZ: number;
  PRODUCTION_BIOMASSE_SOLIDE: number;
  PRODUCTION_CHALEUR_INDUSTRIEL: number;
  PRODUCTION_CHARBON: number;
  PRODUCTION_CHAUDIERES_ELECTRIQUES: number;
  PRODUCTION_DECHETS_INTERNES: number;
  PRODUCTION_FIOUL_DOMESTIQUE: number;
  PRODUCTION_FIOUL_LOURD: number;
  PRODUCTION_GAZ_NATUREL: number;
  PRODUCTION_GEOTHERMIE: number;
  PRODUCTION_GPL: number;
  PRODUCTION_PAC: number;
  PRODUCTION_SOLAIRE_THERMIQUE: number;
  PRODUCTION_TOTALE: number;
  PRODUCTION_UIOM: number;

  // Puissances (MW)
  PUISSANCE: number;
  PUISSANCE_AUTRE_CHALEUR_RECUPEREE: number;
  PUISSANCE_AUTRES: number;
  PUISSANCE_AUTRES_ENR: number;
  PUISSANCE_BIOGAZ: number;
  PUISSANCE_BIOMASSE_SOLIDE: number;
  PUISSANCE_CHALEUR_INDUSTRIEL: number;
  PUISSANCE_CHARBON: number;
  PUISSANCE_CHAUDIERES_ELECTRIQUES: number;
  PUISSANCE_DECHETS_INTERNES: number;
  PUISSANCE_FIOUL_DOMESTIQUE: number;
  PUISSANCE_FIOUL_LOURD: number;
  PUISSANCE_GAZ_NATUREL: number;
  PUISSANCE_GEOTHERMIE: number;
  PUISSANCE_GPL: number;
  PUISSANCE_PAC: number;
  PUISSANCE_SOLAIRE_THERMIQUE: number;
  PUISSANCE_UIOM: number;

  // --- Champs non utilisés ---

  // Cogénération (%)
  PCTCOG: number;
  PCTCOG_AUTRES: number;
  PCTCOG_BIOGAZ: number;
  PCTCOG_BIOMASSE_SOLIDE: number;
  PCTCOG_CHARBON: number;
  PCTCOG_DECHETS_INTERNES: number;
  PCTCOG_FIOUL_DOMESTIQUE: number;
  PCTCOG_FIOUL_LOURD: number;
  PCTCOG_GAZ_NATUREL: number;
  PCTCOG_GPL: number;

  // Puissances froid (MW)
  PUISSANCE_AUTRES_FROID: number;
  PUISSANCE_FROID_PASSIF: number;
  PUISSANCE_GF_ABSORPTION: number;
  PUISSANCE_GF_COMPRESSION: number;
  PUISSANCE_PAC_FROID: number;
};

// --- Calculs ---

/**
 * Calcule le taux ENR&R à partir des productions
 *
 * Sources ENR&R (Énergies Renouvelables et de Récupération) :
 * - Renouvelables : biomasse, géothermie, solaire thermique, PAC, biogaz, autres ENR
 * - Récupération : UIOM, déchets internes, chaleur industrielle, autre chaleur récupérée
 *
 * Note : Les UIOM comptent à 100% car la fraction biodégradable (50%) est renouvelable
 * et la fraction non biodégradable (50%) est de récupération (convention Eurostat/AIE/DGEC).
 */
function calculateTauxEnRR(data: DonneesReseauBrutes): number | null {
  if (data.PRODUCTION_TOTALE === 0) {
    return null;
  }

  const productionEnRR =
    // Renouvelables
    data.PRODUCTION_BIOMASSE_SOLIDE +
    data.PRODUCTION_BIOGAZ +
    data.PRODUCTION_GEOTHERMIE +
    data.PRODUCTION_PAC +
    data.PRODUCTION_SOLAIRE_THERMIQUE +
    data.PRODUCTION_AUTRES_ENR +
    // Récupération
    data.PRODUCTION_AUTRE_CHALEUR_RECUPEREE +
    data.PRODUCTION_CHALEUR_INDUSTRIEL +
    data.PRODUCTION_DECHETS_INTERNES +
    data.PRODUCTION_UIOM;

  return Math.round((productionEnRR / data.PRODUCTION_TOTALE) * 100 * 10) / 10;
}

/**
 * Calcule le rendement du réseau (ratio livraisons / production)
 * Rendement = Livraisons totales / Production totale * 100
 */
function calculateRendement(data: DonneesReseauBrutes): number | null {
  if (data.PRODUCTION_TOTALE === 0 || data.CONSOTOT === 'secret') {
    return null;
  }

  return Math.round((data.CONSOTOT / data.PRODUCTION_TOTALE) * 100 * 10) / 10;
}

// --- Mapping SDES → base ---

type ChaleurPowerFields = Pick<
  DB['reseaux_de_chaleur'],
  | 'puissance_MW_autre_chaleur_recuperee'
  | 'puissance_MW_autres'
  | 'puissance_MW_autres_ENR'
  | 'puissance_MW_biogaz'
  | 'puissance_MW_biomasse_solide'
  | 'puissance_MW_chaleur_industiel'
  | 'puissance_MW_charbon'
  | 'puissance_MW_chaudieres_electriques'
  | 'puissance_MW_dechets_internes'
  | 'puissance_MW_fioul_domestique'
  | 'puissance_MW_fioul_lourd'
  | 'puissance_MW_GPL'
  | 'puissance_MW_gaz_naturel'
  | 'puissance_MW_geothermie'
  | 'puissance_MW_PAC'
  | 'puissance_MW_solaire_thermique'
  | 'puissance_MW_UIOM'
  | 'puissance_totale_MW'
>;

// Only the powers are imported: the FEDENE library is more complete for the other survey figures, and the regulatory
// values (CO2 contents, EnR&R rate, reference year) come from the arrêté DPE import.
function mapFieldsChaleur(data: DonneesReseauBrutes): ChaleurPowerFields {
  return {
    puissance_MW_autre_chaleur_recuperee: data.PUISSANCE_AUTRE_CHALEUR_RECUPEREE,
    puissance_MW_autres: data.PUISSANCE_AUTRES,
    puissance_MW_autres_ENR: data.PUISSANCE_AUTRES_ENR,
    puissance_MW_biogaz: data.PUISSANCE_BIOGAZ,
    puissance_MW_biomasse_solide: data.PUISSANCE_BIOMASSE_SOLIDE,
    puissance_MW_chaleur_industiel: data.PUISSANCE_CHALEUR_INDUSTRIEL,
    puissance_MW_charbon: data.PUISSANCE_CHARBON,
    puissance_MW_chaudieres_electriques: data.PUISSANCE_CHAUDIERES_ELECTRIQUES,
    puissance_MW_dechets_internes: data.PUISSANCE_DECHETS_INTERNES,
    puissance_MW_fioul_domestique: data.PUISSANCE_FIOUL_DOMESTIQUE,
    puissance_MW_fioul_lourd: data.PUISSANCE_FIOUL_LOURD,
    puissance_MW_GPL: data.PUISSANCE_GPL,
    puissance_MW_gaz_naturel: data.PUISSANCE_GAZ_NATUREL,
    puissance_MW_geothermie: data.PUISSANCE_GEOTHERMIE,
    puissance_MW_PAC: data.PUISSANCE_PAC,
    puissance_MW_solaire_thermique: data.PUISSANCE_SOLAIRE_THERMIQUE,
    puissance_MW_UIOM: data.PUISSANCE_UIOM,
    puissance_totale_MW: data.PUISSANCE,
  };
}

function mapFieldsFroid(data: DonneesReseauBrutes): Pick<DB['reseaux_de_froid'], 'puissance_totale_MW'> {
  return { puissance_totale_MW: data.PUISSANCE };
}

// --- Types et formatage du log ---

type FieldDiff = { field: string; newValue: unknown; oldValue: unknown };
type ChangeEntry = { diffs: FieldDiff[]; id: string };

function formatValue(value: unknown): string {
  return value === null || value === undefined ? 'null' : typeof value === 'string' ? `"${value}"` : String(value);
}

function formatChangeEntry({ diffs, id }: ChangeEntry): string {
  return [`### ${id}`, ...diffs.map((diff) => `  ${diff.field}: ${formatValue(diff.oldValue)} → ${formatValue(diff.newValue)}`)].join('\n');
}

// --- Traitement générique d'une filière ---

type NetworkTable = 'reseaux_de_chaleur' | 'reseaux_de_froid';

type FiliereConfig = {
  label: string;
  mapFields: (data: DonneesReseauBrutes) => Record<string, number | null>;
  sncuPattern: RegExp;
  table: NetworkTable;
};

export type FiliereResult = {
  changes: ChangeEntry[];
  invalidIdsCount: number;
  missingFromSdes: string[];
  notFoundIds: string[];
  updatedCount: number;
};

/**
 * Updates the powers of the networks known to the base (keyed by SNCU id). Networks of the SDES file unknown to the base
 * are only reported: the FEDENE import is the one that creates networks.
 */
async function processFiliere(
  config: FiliereConfig,
  reseaux: DonneesReseauBrutes[],
  { dryRun }: { dryRun: boolean }
): Promise<FiliereResult> {
  const existingNetworks = await kdb
    .selectFrom(config.table)
    .select(['id_fcu', 'Identifiant reseau'])
    .where('Identifiant reseau', 'is not', null)
    .execute();
  const idFcuBySncu = new Map(existingNetworks.map((network) => [network['Identifiant reseau'] as string, network.id_fcu]));
  const sncuSdes = new Set(reseaux.map((reseau) => reseau.ID));

  const changes: ChangeEntry[] = [];
  const notFoundIds: string[] = [];
  let updatedCount = 0;
  for (const reseau of reseaux) {
    const idFcu = idFcuBySncu.get(reseau.ID);
    if (idFcu === undefined) {
      notFoundIds.push(reseau.ID);
      continue;
    }
    const fields = config.mapFields(reseau);
    const current = await kdb
      .selectFrom(config.table)
      .select(Object.keys(fields) as any)
      .where('id_fcu', '=', idFcu)
      .executeTakeFirstOrThrow();
    const diffs = Object.entries(fields)
      .map(([field, newValue]) => ({ field, newValue, oldValue: (current as Record<string, unknown>)[field] ?? null }))
      .filter(({ newValue, oldValue }) => oldValue !== newValue);
    if (diffs.length > 0) {
      changes.push({ diffs, id: reseau.ID });
    }
    updatedCount++;
    if (!dryRun) {
      await kdb.updateTable(config.table).set(fields).where('id_fcu', '=', idFcu).execute();
    }
  }

  const missingFromSdes = [...idFcuBySncu.keys()].filter((sncu) => !sncuSdes.has(sncu) && config.sncuPattern.test(sncu));
  const invalidIdsCount = existingNetworks.filter((network) => !config.sncuPattern.test(network['Identifiant reseau'] ?? '')).length;

  return { changes, invalidIdsCount, missingFromSdes, notFoundIds, updatedCount };
}

// --- Écriture du log par filière ---

function writeLogSection(log: (text: string) => void, label: string, { changes }: FiliereResult): void {
  if (changes.length > 0) {
    log(`## Détail des changements - Réseaux de ${label}`);
    log('');
    changes.forEach((change) => {
      log(formatChangeEntry(change));
      log('');
    });
  }
}

function logFiliereConsoleOutput(logger: Logger, label: string, result: FiliereResult): void {
  logger.info(`Réseaux de ${label}: ${result.updatedCount} mis à jour`);
  if (result.invalidIdsCount > 0) {
    logger.warn(`${result.invalidIdsCount} réseaux de ${label} en base ont un identifiant SNCU invalide`);
  }
  if (result.notFoundIds.length > 0) {
    console.log(`\nRéseaux de ${label} dans SDES mais absents de la base (${result.notFoundIds.length}):`);
    console.log(result.notFoundIds.sort().join('\n'));
  }
  if (result.missingFromSdes.length > 0) {
    console.log(`\nRéseaux de ${label} en base mais absents des données SDES (${result.missingFromSdes.length}):`);
    console.log(result.missingFromSdes.sort().join('\n'));
  }
}

// --- Configuration des filières ---

const FILIERE_CHALEUR: FiliereConfig = {
  label: 'chaleur',
  mapFields: mapFieldsChaleur,
  sncuPattern: /^\d+C$/,
  table: 'reseaux_de_chaleur',
};

const FILIERE_FROID: FiliereConfig = {
  label: 'froid',
  mapFields: mapFieldsFroid,
  sncuPattern: /^\d+F$/,
  table: 'reseaux_de_froid',
};

// --- Import principal ---

export const importDonneesReseauxSdes = defineImportFunc(async ({ logger, options }) => {
  const dryRun = options?.dryRun ?? false;

  logger.info("Début de l'import des données techniques des réseaux (millésime 2024)");
  logger.info(`Mode: ${dryRun ? 'dry-run' : 'live'}`);

  const donneesReseaux = await fetchJSON<DonneesReseauBrutes[]>(SDES_API_URL);
  logger.info(`${donneesReseaux.length} enregistrements téléchargés depuis l'API SDES`);

  const results = await importSdesRows(donneesReseaux, { dryRun, logger });

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const logFilePath = `import-sdes-${timestamp}.log`;
  const logStream = createWriteStream(logFilePath, { encoding: 'utf-8' });
  const log = (text: string) => logStream.write(`${text}\n`);
  log(`# Import SDES - ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  log(`Mode: ${dryRun ? 'dry-run' : 'live'}`);
  log('');
  writeLogSection(log, FILIERE_CHALEUR.label, results.chaleur);
  writeLogSection(log, FILIERE_FROID.label, results.froid);
  log('## Résumé');
  log(`- Réseaux de chaleur mis à jour: ${results.chaleur.updatedCount}`);
  log(`- Réseaux de froid mis à jour: ${results.froid.updatedCount}`);
  logStream.end();
  await finished(logStream);
  logger.info(`Fichier de log généré: ${logFilePath}`);
});

/** Applies the SDES records to the base (exported for tests: no download, no log file). */
export const importSdesRows = async (donneesReseaux: DonneesReseauBrutes[], { dryRun, logger }: { dryRun: boolean; logger: Logger }) => {
  const reseauxChaleur = donneesReseaux.filter((reseau) => reseau.FILIERE === 'C');
  const reseauxFroid = donneesReseaux.filter((reseau) => reseau.FILIERE === 'F');
  logger.info(`${reseauxChaleur.length} réseaux de chaleur, ${reseauxFroid.length} réseaux de froid`);

  const chaleur = await processFiliere(FILIERE_CHALEUR, reseauxChaleur, { dryRun });
  logFiliereConsoleOutput(logger, FILIERE_CHALEUR.label, chaleur);
  const froid = await processFiliere(FILIERE_FROID, reseauxFroid, { dryRun });
  logFiliereConsoleOutput(logger, FILIERE_FROID.label, froid);
  return { chaleur, froid };
};
