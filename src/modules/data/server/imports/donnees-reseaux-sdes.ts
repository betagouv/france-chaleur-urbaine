import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';

import type { Record as AirtableRecord } from 'airtable';
import type { FieldSet } from 'airtable/lib/field_set';

import { AirtableDB } from '@/server/db/airtable';
import type { Logger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';
import { processInParallel } from '@/utils/async';
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
type DonneesReseauBrutes = {
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

// --- Mapping SDES → Airtable ---

function mapToAirtableFieldsChaleur(data: DonneesReseauBrutes) {
  return {
    // Contenus CO2
    // 'contenu CO2': data.CONTENU_EN_CO2,
    // 'contenu CO2 ACV': data.CONTENU_EN_CO2_ACV,

    // Livraisons (MWh)
    // livraisons_agriculture_MWh: data.CONSOA,
    // livraisons_autre_MWh: data.CONSONA,
    // livraisons_industrie_MWh: data.CONSOI,
    // livraisons_residentiel_MWh: data.CONSOR,
    // livraisons_tertiaire_MWh: data.CONSOT,
    // livraisons_totale_MWh: data.CONSOTOT,

    // Année de référence
    // 'Moyenne-annee-DPE': data.ANNEE,

    // Points de livraison
    // nb_pdl: data.PDL,
    // nom_reseau: data.OPERATEUR,

    // Productions (MWh)
    // prod_MWh_autre_chaleur_recuperee: data.PRODUCTION_AUTRE_CHALEUR_RECUPEREE,
    // prod_MWh_autres: data.PRODUCTION_AUTRES,
    // prod_MWh_autres_ENR: data.PRODUCTION_AUTRES_ENR,
    // prod_MWh_biogaz: data.PRODUCTION_BIOGAZ,
    // prod_MWh_biomasse_solide: data.PRODUCTION_BIOMASSE_SOLIDE,
    // prod_MWh_chaleur_industiel: data.PRODUCTION_CHALEUR_INDUSTRIEL,
    // prod_MWh_charbon: data.PRODUCTION_CHARBON,
    // prod_MWh_chaudieres_electriques: data.PRODUCTION_CHAUDIERES_ELECTRIQUES,
    // prod_MWh_dechets_internes: data.PRODUCTION_DECHETS_INTERNES,
    // prod_MWh_fioul_domestique: data.PRODUCTION_FIOUL_DOMESTIQUE,
    // prod_MWh_fioul_lourd: data.PRODUCTION_FIOUL_LOURD,
    // prod_MWh_GPL: data.PRODUCTION_GPL,
    // prod_MWh_gaz_naturel: data.PRODUCTION_GAZ_NATUREL,
    // prod_MWh_geothermie: data.PRODUCTION_GEOTHERMIE,
    // prod_MWh_PAC: data.PRODUCTION_PAC,
    // prod_MWh_solaire_thermique: data.PRODUCTION_SOLAIRE_THERMIQUE,
    // prod_MWh_UIOM: data.PRODUCTION_UIOM,
    // production_totale_MWh: data.PRODUCTION_TOTALE,

    // Puissances (MW)
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

    // Indicateurs calculés
    // 'Rend%': calculateRendement(data),
    // 'Taux EnR&R': calculateTauxEnRR(data),
  };
}

/**
 * Note: Le champ 'Taux EnR&R' n'existe pas dans la table Airtable des réseaux de froid
 */
function mapToAirtableFieldsFroid(data: DonneesReseauBrutes) {
  return {
    // 'contenu CO2': data.CONTENU_EN_CO2,
    // 'contenu CO2 ACV': data.CONTENU_EN_CO2_ACV,
    // livraisons_agriculture_MWh: data.CONSOA,
    // livraisons_autre_MWh: data.CONSONA,
    // livraisons_industrie_MWh: data.CONSOI,
    // livraisons_residentiel_MWh: data.CONSOR,
    // livraisons_tertiaire_MWh: data.CONSOT,
    // livraisons_totale_MWh: data.CONSOTOT,
    // 'Moyenne-annee-DPE': data.ANNEE,
    // nb_pdl: data.PDL,
    // nom_reseau: data.OPERATEUR,
    // production_totale_MWh: data.PRODUCTION_TOTALE,
    puissance_totale_MW: data.PUISSANCE,
    // 'Rend%': calculateRendement(data),
  };
}

// --- Helpers de données ---

function prepareUpdateData(data: Record<string, unknown>): Partial<FieldSet> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === 'secret' ? null : value])) as Partial<FieldSet>;
}

function collectDiffs(airtableRecord: AirtableRecord<FieldSet>, newData: Partial<FieldSet>): FieldDiff[] {
  return Object.entries(newData)
    .map(([field, newValue]) => ({
      field,
      newValue: newValue ?? null,
      oldValue: airtableRecord.get(field) ?? null,
    }))
    .filter(({ newValue, oldValue }) => oldValue !== newValue);
}

function buildCreateDiffs(createData: Partial<FieldSet>): FieldDiff[] {
  return Object.entries(createData).map(([field, newValue]) => ({
    field,
    newValue: newValue ?? null,
    oldValue: null,
  }));
}

// --- Types et formatage du log ---

type FieldDiff = {
  field: string;
  newValue: unknown;
  oldValue: unknown;
};

type ChangeEntry = {
  diffs: FieldDiff[];
  id: string;
  type: 'UPDATE' | 'CREATE';
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return String(value);
}

function formatChangeEntry({ diffs, id, type }: ChangeEntry): string {
  return [`### ${id} - ${type}`, ...diffs.map((d) => `  ${d.field}: ${formatValue(d.oldValue)} → ${formatValue(d.newValue)}`)].join('\n');
}

// --- Traitement générique d'une filière ---

type FiliereConfig = {
  label: string;
  mapToAirtableFields: (data: DonneesReseauBrutes) => Record<string, unknown>;
  sncuPattern: RegExp;
  table: Airtable;
};

type FiliereResult = {
  changes: ChangeEntry[];
  createdCount: number;
  invalidIdsCount: number;
  missingFromSdes: string[];
  notFoundIds: string[];
  updatedCount: number;
};

async function processFiliere(
  config: FiliereConfig,
  reseaux: DonneesReseauBrutes[],
  airtableRecords: readonly AirtableRecord<FieldSet>[],
  sncuSdes: Set<string>,
  { dryRun }: { dryRun: boolean }
): Promise<FiliereResult> {
  const airtableBySncu = new Map<string, AirtableRecord<FieldSet>>(
    airtableRecords.map((record) => [record.get('Identifiant reseau') as string, record])
  );

  // Séparation found / not-found
  const toUpdate = reseaux
    .map((reseau) => ({ airtableRecord: airtableBySncu.get(reseau.ID), reseau }))
    .filter((r): r is { airtableRecord: AirtableRecord<FieldSet>; reseau: DonneesReseauBrutes } => r.airtableRecord != null);

  const notFound = reseaux.filter((r) => !airtableBySncu.has(r.ID));

  // Calcul des diffs pour les updates
  const updates = toUpdate.map(({ airtableRecord, reseau }) => {
    const updateData = prepareUpdateData(config.mapToAirtableFields(reseau));
    return { airtableRecord, diffs: collectDiffs(airtableRecord, updateData), id: reseau.ID, updateData };
  });

  const updateChanges: ChangeEntry[] = updates
    .filter(({ diffs }) => diffs.length > 0)
    .map(({ diffs, id }) => ({ diffs, id, type: 'UPDATE' as const }));

  if (!dryRun) {
    await processInParallel(updates, 5, async ({ airtableRecord, updateData }) => {
      await AirtableDB(config.table).update(airtableRecord.id, updateData);
    });
  }

  // Création des réseaux manquants
  const creates = notFound.map((reseau) => ({
    createData: prepareUpdateData({ 'Identifiant reseau': reseau.ID, ...config.mapToAirtableFields(reseau) }),
    id: reseau.ID,
  }));

  const createChanges: ChangeEntry[] = creates.map(({ createData, id }) => ({
    diffs: buildCreateDiffs(createData),
    id,
    type: 'CREATE' as const,
  }));

  if (!dryRun && creates.length > 0) {
    await processInParallel(creates, 5, async ({ createData }) => {
      await AirtableDB(config.table).create(createData);
    });
  }

  // Réseaux absents du SDES (identifiants valides uniquement)
  const missingFromSdes = [...airtableBySncu.keys()].filter((id) => !sncuSdes.has(id) && id && config.sncuPattern.test(id));

  const invalidIdsCount = airtableRecords.filter((r) => {
    const id = r.get('Identifiant reseau') as string;
    return !id || !config.sncuPattern.test(id);
  }).length;

  return {
    changes: [...updateChanges, ...createChanges],
    createdCount: creates.length,
    invalidIdsCount,
    missingFromSdes,
    notFoundIds: notFound.map((r) => r.ID),
    updatedCount: updates.length,
  };
}

// --- Écriture du log par filière ---

function writeLogSection(log: (text: string) => void, label: string, { changes }: FiliereResult): void {
  if (changes.length > 0) {
    log(`## Détail des changements - Réseaux de ${label}`);
    log('');
    changes.forEach((c) => {
      log(formatChangeEntry(c));
      log('');
    });
  }
}

function logFiliereConsoleOutput(logger: Logger, label: string, result: FiliereResult): void {
  logger.info(
    `Réseaux de ${label}: ${result.updatedCount} mis à jour, ${result.createdCount} créés, ${result.absents.length} marqués absents`
  );
  if (result.invalidIdsCount > 0) {
    logger.warn(`${result.invalidIdsCount} réseaux de ${label} dans Airtable ont un identifiant SNCU invalide ou vide`);
  }
  if (result.notFoundIds.length > 0) {
    console.log(`\nRéseaux de ${label} dans SDES mais absents d'Airtable (${result.notFoundIds.length}):`);
    console.log(result.notFoundIds.sort().join('\n'));
  }
  if (result.missingFromSdes.length > 0) {
    console.log(`\nRéseaux de ${label} dans Airtable mais absents des données SDES (${result.missingFromSdes.length}):`);
    console.log(result.missingFromSdes.sort().join('\n'));
  }
}

// --- Configuration des filières ---

const FILIERE_CHALEUR: FiliereConfig = {
  label: 'chaleur',
  mapToAirtableFields: mapToAirtableFieldsChaleur,
  sncuPattern: /^\d+C$/,
  table: Airtable.NETWORKS,
};

const FILIERE_FROID: FiliereConfig = {
  label: 'froid',
  mapToAirtableFields: mapToAirtableFieldsFroid,
  sncuPattern: /^\d+F$/,
  table: Airtable.COLD_NETWORKS,
};

// --- Import principal ---

export const importDonneesReseauxSdes = defineImportFunc(async ({ logger, options }) => {
  const dryRun = options?.dryRun ?? false;

  logger.info("Début de l'import des données techniques des réseaux (millésime 2024)");
  logger.info(`Mode: ${dryRun ? 'dry-run' : 'live'}`);

  const donneesReseaux = await fetchJSON<DonneesReseauBrutes[]>(SDES_API_URL);
  logger.info(`${donneesReseaux.length} enregistrements téléchargés depuis l'API SDES`);

  const reseauxChaleur = donneesReseaux.filter((r) => r.FILIERE === 'C');
  const reseauxFroid = donneesReseaux.filter((r) => r.FILIERE === 'F');
  logger.info(`${reseauxChaleur.length} réseaux de chaleur, ${reseauxFroid.length} réseaux de froid`);

  const [airtableChaleur, airtableFroid] = await Promise.all([
    AirtableDB(Airtable.NETWORKS).select().all(),
    AirtableDB(Airtable.COLD_NETWORKS).select().all(),
  ]);
  logger.info(`${airtableChaleur.length} réseaux de chaleur existants dans Airtable`);
  logger.info(`${airtableFroid.length} réseaux de froid existants dans Airtable`);

  // Fichier de log en streaming
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const logFilePath = `import-sdes-${timestamp}.log`;
  const logStream = createWriteStream(logFilePath, { encoding: 'utf-8' });
  const log = (text: string) => logStream.write(`${text}\n`);

  log(`# Import SDES 2024 - ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  log(`Mode: ${dryRun ? 'dry-run' : 'live'}`);
  log('');

  const opts = { dryRun };
  const sncuChaleurSdes = new Set(reseauxChaleur.map((r) => r.ID));
  const sncuFroidSdes = new Set(reseauxFroid.map((r) => r.ID));

  // Traitement des deux filières
  const resultChaleur = await processFiliere(FILIERE_CHALEUR, reseauxChaleur, airtableChaleur, sncuChaleurSdes, opts);
  writeLogSection(log, FILIERE_CHALEUR.label, resultChaleur);
  logFiliereConsoleOutput(logger, FILIERE_CHALEUR.label, resultChaleur);

  const resultFroid = await processFiliere(FILIERE_FROID, reseauxFroid, airtableFroid, sncuFroidSdes, opts);
  writeLogSection(log, FILIERE_FROID.label, resultFroid);
  logFiliereConsoleOutput(logger, FILIERE_FROID.label, resultFroid);

  // Résumé en fin de fichier
  log('## Résumé');
  for (const [label, result] of [
    [FILIERE_CHALEUR.label, resultChaleur],
    [FILIERE_FROID.label, resultFroid],
  ] as const) {
    const updated = result.changes.filter((c) => c.type === 'UPDATE').length;
    const created = result.changes.filter((c) => c.type === 'CREATE').length;
    log(`- Réseaux de ${label} mis à jour: ${updated}`);
    log(`- Réseaux de ${label} créés: ${created}`);
  }

  logStream.end();
  await finished(logStream);
  logger.info(`Fichier de log généré: ${logFilePath}`);

  const totalUpdated = resultChaleur.updatedCount + resultFroid.updatedCount;
  const totalCreated = resultChaleur.createdCount + resultFroid.createdCount;
  logger.info(`Import terminé: ${totalUpdated} réseaux mis à jour, ${totalCreated} créés (données millésime 2024)`);
});
