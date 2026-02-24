import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';

import type { Record as AirtableRecord } from 'airtable';
import type { FieldSet } from 'airtable/lib/field_set';

import { serverConfig } from '@/server/config';
import { AirtableDB, createField, listTables } from '@/server/db/airtable';
import type { Logger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';
import { processInParallel } from '@/utils/async';

import { defineFileImportFunc } from '../import';
import { loadXlsxFromFile } from '../import-utils';

// ---------------------------------------------------------------------------
// Constants + Types
// ---------------------------------------------------------------------------

const EDITION_YEAR = 2025;
const EXCEL_SHEET_NAME = 'BDD - complète';
const PRESENT_FIELD_NAME = `present_biblio_fedene_${EDITION_YEAR}`;

const FIELDS_TO_ENSURE = [
  `enquete_commune_${EDITION_YEAR}`,
  `Gestionnaire_${EDITION_YEAR}`,
  'longueur_reseau_aller',
  `MO_${EDITION_YEAR}`,
  `nom_reseau_${EDITION_YEAR}`,
  PRESENT_FIELD_NAME,
];

type ExcelRowBrute = {
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

type FiliereConfig = {
  label: string;
  mapFields: (data: ExcelRowBrute, existing?: AirtableRecord<FieldSet>) => Record<string, unknown>;
  sncuPattern: RegExp;
  table: Airtable;
};

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

type AbsentEntry = {
  id: string;
  oldValue: unknown;
  recordId: string;
};

type FiliereResult = {
  absents: AbsentEntry[];
  changes: ChangeEntry[];
  createdCount: number;
  invalidIdsCount: number;
  missingFromExcel: string[];
  notFoundIds: string[];
  updatedCount: number;
};

// ---------------------------------------------------------------------------
// Filière configs
// ---------------------------------------------------------------------------

const FILIERE_CHALEUR: FiliereConfig = {
  label: 'chaleur',
  mapFields: mapFieldsChaleur,
  sncuPattern: /^\d+C$/,
  table: Airtable.NETWORKS,
};

const FILIERE_FROID: FiliereConfig = {
  label: 'froid',
  mapFields: mapFieldsFroid,
  sncuPattern: /^\d+F$/,
  table: Airtable.COLD_NETWORKS,
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const importDonneesReseauxBibliothequeFedene = defineFileImportFunc(async ({ filepath, logger, options }) => {
  const dryRun = options?.dryRun ?? false;

  logger.info(`Début de l'import des données réseaux depuis le fichier Fedene (Edition ${EDITION_YEAR})`);
  logger.info(`Mode: ${dryRun ? 'dry-run' : 'live'}`);

  // 1. Read Excel
  const rows = (await loadXlsxFromFile(filepath, EXCEL_SHEET_NAME)) as ExcelRowBrute[];
  logger.info(`${rows.length} lignes lues depuis le fichier Excel`);

  const reseauxChaleur = rows.filter((r) => r['ID EARCF']?.endsWith('C'));
  const reseauxFroid = rows.filter((r) => r['ID EARCF']?.endsWith('F'));
  logger.info(`${reseauxChaleur.length} réseaux de chaleur, ${reseauxFroid.length} réseaux de froid`);

  // 2. Ensure fields exist in Airtable
  if (!dryRun) {
    await ensureFieldsExist(logger, Airtable.NETWORKS);
    await ensureFieldsExist(logger, Airtable.COLD_NETWORKS);
  }

  // 3. Read Airtable data
  const [airtableChaleur, airtableFroid] = await Promise.all([
    AirtableDB(Airtable.NETWORKS).select().all(),
    AirtableDB(Airtable.COLD_NETWORKS).select().all(),
  ]);
  logger.info(`${airtableChaleur.length} réseaux de chaleur existants dans Airtable`);
  logger.info(`${airtableFroid.length} réseaux de froid existants dans Airtable`);

  // 4. Process each filière (updates, creates, absents)
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const logFilePath = `import-bibliotheque-fedene-${timestamp}.log`;
  const logStream = createWriteStream(logFilePath, { encoding: 'utf-8' });
  const log = (text: string) => logStream.write(`${text}\n`);

  log(`# Import Fedene Edition ${EDITION_YEAR} - ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  log(`Mode: ${dryRun ? 'dry-run' : 'live'}`);
  log('');

  const opts = { dryRun };
  const sncuChaleurExcel = new Set(reseauxChaleur.map((r) => r['ID EARCF']));
  const sncuFroidExcel = new Set(reseauxFroid.map((r) => r['ID EARCF']));

  const resultChaleur = await processFiliere(FILIERE_CHALEUR, reseauxChaleur, airtableChaleur, sncuChaleurExcel, opts);
  writeLogSection(log, FILIERE_CHALEUR.label, resultChaleur);
  logFiliereConsoleOutput(logger, FILIERE_CHALEUR.label, resultChaleur);

  const resultFroid = await processFiliere(FILIERE_FROID, reseauxFroid, airtableFroid, sncuFroidExcel, opts);
  writeLogSection(log, FILIERE_FROID.label, resultFroid);
  logFiliereConsoleOutput(logger, FILIERE_FROID.label, resultFroid);

  // 5. Write report
  log('## Résumé');
  for (const [label, result] of [
    [FILIERE_CHALEUR.label, resultChaleur],
    [FILIERE_FROID.label, resultFroid],
  ] as const) {
    const updated = result.changes.filter((c) => c.type === 'UPDATE').length;
    const created = result.changes.filter((c) => c.type === 'CREATE').length;
    log(`- Réseaux de ${label} mis à jour: ${updated}`);
    log(`- Réseaux de ${label} créés: ${created}`);
    log(`- Réseaux de ${label} marqués absents de l'enquête: ${result.absents.length}`);
  }

  logStream.end();
  await finished(logStream);
  logger.info(`Fichier de log généré: ${logFilePath}`);

  const totalUpdated = resultChaleur.updatedCount + resultFroid.updatedCount;
  const totalCreated = resultChaleur.createdCount + resultFroid.createdCount;
  const totalAbsents = resultChaleur.absents.length + resultFroid.absents.length;
  logger.info(`Import terminé: ${totalUpdated} réseaux mis à jour, ${totalCreated} créés, ${totalAbsents} marqués absents`);
});

// ---------------------------------------------------------------------------
// Processing logic
// ---------------------------------------------------------------------------

async function processFiliere(
  config: FiliereConfig,
  reseaux: ExcelRowBrute[],
  airtableRecords: readonly AirtableRecord<FieldSet>[],
  sncuExcel: Set<string>,
  { dryRun }: { dryRun: boolean }
): Promise<FiliereResult> {
  const airtableBySncu = new Map<string, AirtableRecord<FieldSet>>(
    airtableRecords.map((record) => [record.get('Identifiant reseau') as string, record])
  );

  const toUpdate = reseaux
    .map((reseau) => ({ airtableRecord: airtableBySncu.get(reseau['ID EARCF']), reseau }))
    .filter((r): r is { airtableRecord: AirtableRecord<FieldSet>; reseau: ExcelRowBrute } => r.airtableRecord != null);

  const notFound = reseaux.filter((r) => !airtableBySncu.has(r['ID EARCF']));

  const updates = toUpdate.map(({ airtableRecord, reseau }) => {
    const fields = config.mapFields(reseau, airtableRecord);
    const updateData = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value ?? null])) as Partial<FieldSet>;
    return { airtableRecord, diffs: collectDiffs(airtableRecord, updateData), id: reseau['ID EARCF'], updateData };
  });

  const updateChanges: ChangeEntry[] = updates
    .filter(({ diffs }) => diffs.length > 0)
    .map(({ diffs, id }) => ({ diffs, id, type: 'UPDATE' as const }));

  if (!dryRun) {
    await processInParallel(updates, 5, async ({ airtableRecord, id, updateData }) => {
      try {
        await AirtableDB(config.table).update(airtableRecord.id, updateData);
      } catch (error) {
        console.error(`Failed to update record ${id}:`, JSON.stringify(updateData, null, 2));
        throw error;
      }
    });
  }

  const creates = notFound.map((reseau) => {
    const fields = config.mapFields(reseau);
    return {
      createData: Object.fromEntries(
        Object.entries({ 'Identifiant reseau': reseau['ID EARCF'], ...fields }).map(([key, value]) => [key, value ?? null])
      ) as Partial<FieldSet>,
      id: reseau['ID EARCF'],
    };
  });

  const createChanges: ChangeEntry[] = creates.map(({ createData, id }) => ({
    diffs: buildCreateDiffs(createData),
    id,
    type: 'CREATE' as const,
  }));

  if (!dryRun && creates.length > 0) {
    await processInParallel(creates, 5, async ({ createData, id }) => {
      try {
        await AirtableDB(config.table).create(createData);
      } catch (error) {
        console.error(`Failed to create record ${id}:`, JSON.stringify(createData, null, 2));
        throw error;
      }
    });
  }

  const missingFromExcel = [...airtableBySncu.keys()].filter((id) => !sncuExcel.has(id) && id && config.sncuPattern.test(id));

  const invalidIdsCount = airtableRecords.filter((r) => {
    const id = r.get('Identifiant reseau') as string;
    return !id || !config.sncuPattern.test(id);
  }).length;

  const absents: AbsentEntry[] = missingFromExcel
    .map((id) => {
      const record = airtableBySncu.get(id)!;
      return { id, oldValue: record.get(PRESENT_FIELD_NAME) ?? null, recordId: record.id };
    })
    .filter(({ oldValue }) => oldValue != null && oldValue !== '');

  if (!dryRun && absents.length > 0) {
    await processInParallel(absents, 5, async ({ recordId }) => {
      await AirtableDB(config.table).update(recordId, { [PRESENT_FIELD_NAME]: '' });
    });
  }

  return {
    absents,
    changes: [...updateChanges, ...createChanges],
    createdCount: creates.length,
    invalidIdsCount,
    missingFromExcel,
    notFoundIds: notFound.map((r) => r['ID EARCF']),
    updatedCount: updates.length,
  };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function writeLogSection(log: (text: string) => void, label: string, { absents, changes }: FiliereResult): void {
  if (changes.length > 0) {
    log(`## Détail des changements - Réseaux de ${label}`);
    log('');
    changes.forEach((c) => {
      log(formatChangeEntry(c));
      log('');
    });
  }

  if (absents.length > 0) {
    log(`## Réseaux de ${label} marqués absents de l'enquête`);
    log('');
    absents.forEach((a) => {
      log(formatAbsentEntry(a));
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
    console.log(`\nRéseaux de ${label} dans Excel mais absents d'Airtable (${result.notFoundIds.length}):`);
    console.log(result.notFoundIds.sort().join('\n'));
  }
  if (result.missingFromExcel.length > 0) {
    console.log(`\nRéseaux de ${label} dans Airtable mais absents du fichier Excel (${result.missingFromExcel.length}):`);
    console.log(result.missingFromExcel.sort().join('\n'));
  }
}

function formatChangeEntry({ diffs, id, type }: ChangeEntry): string {
  return [`### ${id} - ${type}`, ...diffs.map((d) => `  ${d.field}: ${formatValue(d.oldValue)} → ${formatValue(d.newValue)}`)].join('\n');
}

function formatAbsentEntry({ id, oldValue }: AbsentEntry): string {
  return [`### ${id}`, `  ${PRESENT_FIELD_NAME}: ${formatValue(oldValue)} → ""`].join('\n');
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapCommonFields(data: ExcelRowBrute, existing?: AirtableRecord<FieldSet>): Record<string, unknown> {
  const mo = toStringOrNull(data["Maitre d'Ouvrage"]);
  const gestionnaire = formatGestionnaire(data.Gestionnaire, data['Groupe gestionnaire']);

  return {
    [`enquete_commune_${EDITION_YEAR}`]: toStringOrNull(data.Commune),
    [`Gestionnaire_${EDITION_YEAR}`]: existing ? valueOrIdentique(gestionnaire, existing.get('Gestionnaire')) : gestionnaire,
    [`MO_${EDITION_YEAR}`]: existing ? valueOrIdentique(mo, existing.get('MO')) : mo,
    livraisons_autre_MWh: data['Livraisons Autre MWh'],
    livraisons_industrie_MWh: data['Livraisons Industrie MWh'],
    livraisons_residentiel_MWh: data['Livraisons Résidentiel MWh'],
    livraisons_tertiaire_MWh: data['Livraisons Tertiaire MWh'],
    livraisons_totale_MWh: data['Livraisons nettes MWh'],
    longueur_reseau_aller: parseLongueur(data['Longueur du réseau km (aller)']),
    nb_pdl: data['Nombre points de livraison'],
    [`nom_reseau_${EDITION_YEAR}`]: existing
      ? valueOrIdentique(toStringOrNull(data.Nom), existing.get('nom_reseau'))
      : toStringOrNull(data.Nom),
    [PRESENT_FIELD_NAME]: 'oui',
    production_totale_MWh: data['Production totale MWh'],
    'Rend%': ratioToPercent(data['Rendement de distribution']),
  };
}

function mapFieldsChaleur(data: ExcelRowBrute, existing?: AirtableRecord<FieldSet>): Record<string, unknown> {
  return {
    ...mapCommonFields(data, existing),
    'Dev_reseau%': ratioToPercent(data['Développement réseau']),
    livraisons_agriculture_MWh: data['Livraisons Agriculture MWh'],
    'PF%': ratioToPercent(toNumberOrNull(data['Part fixe'])),
    PM: toNumberOrNull(data['Prix moyen \n€ TTC/MWh']),
    PM_L: toNumberOrNull(data['Coût en € TTC/MWh \nRésidence 30 lots']),
    PM_T: toNumberOrNull(data['Coût en € TTC/MWh \nBâtiment tertiaire']),
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

function mapFieldsFroid(data: ExcelRowBrute, existing?: AirtableRecord<FieldSet>): Record<string, unknown> {
  return mapCommonFields(data, existing);
}

// ---------------------------------------------------------------------------
// Field creation
// ---------------------------------------------------------------------------

async function ensureFieldsExist(logger: Logger, tableName: string): Promise<void> {
  const tables = await listTables(serverConfig.AIRTABLE_BASE);
  const table = tables.find((t) => t.name === tableName);
  if (!table) {
    throw new Error(`Table "${tableName}" not found in Airtable base`);
  }

  const existingFields = new Set(table.fields.map((f: { name: string }) => f.name));
  const missingFields = FIELDS_TO_ENSURE.filter((name) => !existingFields.has(name));

  if (missingFields.length === 0) {
    logger.info(`All new fields already exist in "${tableName}"`);
    return;
  }

  logger.info(`Creating ${missingFields.length} missing fields in "${tableName}": ${missingFields.join(', ')}`);
  for (const name of missingFields) {
    await createField(serverConfig.AIRTABLE_BASE, table.id, { name, type: 'singleLineText' });
    logger.info(`  Created field "${name}"`);
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Parse "[10,20]" into "10,20" */
function parseLongueur(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const match = value.match(/\[([^\]]+)\]/);
  return match ? match[1] : null;
}

/** Convert ratio (0.82) to percentage (82.0) rounded to 1 decimal */
function ratioToPercent(value: number | null): number | null {
  if (value == null) {
    return null;
  }
  return Math.round(value * 100 * 10) / 10;
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(value: unknown): string | null {
  return value != null ? String(value) : null;
}

function formatGestionnaire(gestionnaire: string | null, groupe: string | null): string | null {
  if (!gestionnaire) {
    return null;
  }
  if (!groupe || gestionnaire.toLowerCase().includes(groupe.toLowerCase())) {
    return gestionnaire;
  }
  return `${gestionnaire} (${groupe})`;
}

function valueOrIdentique(newValue: string | null, existingValue: unknown): string | null {
  if (newValue == null) {
    return null;
  }
  return newValue === toStringOrNull(existingValue) ? '<<<IDENTIQUE>>>' : newValue;
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

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return String(value);
}
