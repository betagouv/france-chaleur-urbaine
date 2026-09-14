import { readFile, writeFile } from 'node:fs/promises';

import Papa from 'papaparse';
import { z } from 'zod';

import { runTilesGeneration } from '@/modules/tiles/server/generation-run';
import { type DB, kdb } from '@/server/db/kysely';
import type { Logger } from '@/server/helpers/logger';

import { defineFileImportFunc } from '../import';

/**
 * Regulatory network values (CO2 contents, EnR&R rate, reference year) published yearly in the annex
 * of the "arrêté DPE" on Légifrance. Networks are matched by SNCU identifier; networks absent from the
 * annex lose their previous values so the displayed data always matches the referenced arrêté.
 * Yearly procedure (Légifrance page → CSV → import → constants): see docs/import_arrete_dpe.md.
 */

const SNCU_PATTERN = /^\d+[CF]$/;
const AVERAGE_REFERENCE_YEAR = 'Moyenne'; // stored as-is in "Moyenne-annee-DPE", the years are in dataSourcesVersions.arreteDpe

const zNullableNumber = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : Number(value)))
  .refine((value) => value === null || Number.isFinite(value), 'invalid number');

export const zArreteDpeRow = z.object({
  annee_reference: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .pipe(z.union([z.literal(AVERAGE_REFERENCE_YEAR), z.string().regex(/^\d{4}$/), z.null()])),
  contenu_co2: zNullableNumber,
  contenu_co2_acv: zNullableNumber,
  identifiant: z.string().trim().regex(SNCU_PATTERN),
  localisation: z.string().trim(),
  nom: z.string().trim(),
  taux_enrr: zNullableNumber,
});

export type ArreteDpeRow = z.infer<typeof zArreteDpeRow>;

const csvColumns = [
  'identifiant',
  'nom',
  'localisation',
  'contenu_co2',
  'contenu_co2_acv',
  'taux_enrr',
  'annee_reference',
] as const satisfies readonly (keyof ArreteDpeRow)[];

// ---------------------------------------------------------------------------
// Légifrance HTML → rows
// ---------------------------------------------------------------------------

const decodeHtmlEntities = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const cellToText = (cellHtml: string) =>
  decodeHtmlEntities(cellHtml.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const isEmptyCell = (text: string) => text === '' || text === '-';

// "0,175" → 0.175, "51,1 %" → 51.1
const parseFrenchNumber = (text: string, identifiant: string): number | null => {
  if (isEmptyCell(text)) {
    return null;
  }
  const value = Number(text.replace(/[%\s ]/g, '').replace(',', '.'));
  if (!Number.isFinite(value)) {
    throw new Error(`Valeur numérique invalide "${text}" pour le réseau ${identifiant}`);
  }
  return value;
};

const parseReferenceYear = (text: string, identifiant: string): ArreteDpeRow['annee_reference'] => {
  if (isEmptyCell(text)) {
    return null;
  }
  if (/^moyenne/i.test(text)) {
    return AVERAGE_REFERENCE_YEAR;
  }
  if (/^\d{4}$/.test(text)) {
    return text;
  }
  throw new Error(`Année de référence invalide "${text}" pour le réseau ${identifiant}`);
};

const assertUniqueIdentifiants = (rows: ArreteDpeRow[]) => {
  const seen = new Set<string>();
  const duplicates = rows.map((row) => row.identifiant).filter((identifiant) => seen.size === seen.add(identifiant).size);
  if (duplicates.length > 0) {
    throw new Error(`Identifiants réseau en double dans l'arrêté : ${[...new Set(duplicates)].join(', ')}`);
  }
};

/**
 * Extracts the network rows from the saved Légifrance page: any table row whose first cell is an
 * SNCU identifier, with the 7 annex columns (id, name, location, CO2, CO2 ACV, EnR&R, reference year).
 */
export function parseArreteDpeHtml(html: string): ArreteDpeRow[] {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((rowMatch) =>
      [...(rowMatch[1] ?? '').matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cellMatch) => cellToText(cellMatch[1] ?? ''))
    )
    .filter(
      (cells): cells is [string, string, string, string, string, string, string] => cells.length >= 7 && SNCU_PATTERN.test(cells[0] ?? '')
    )
    .map((cells) => ({
      annee_reference: parseReferenceYear(cells[6], cells[0]),
      contenu_co2: parseFrenchNumber(cells[3], cells[0]),
      contenu_co2_acv: parseFrenchNumber(cells[4], cells[0]),
      identifiant: cells[0],
      localisation: cells[2],
      nom: cells[1],
      taux_enrr: parseFrenchNumber(cells[5], cells[0]),
    }));
  assertUniqueIdentifiants(rows);
  return rows;
}

// ---------------------------------------------------------------------------
// CSV (versioned in src/data/arrete-dpe/)
// ---------------------------------------------------------------------------

export const toArreteDpeCsv = (rows: ArreteDpeRow[]) => `${Papa.unparse(rows, { columns: [...csvColumns], newline: '\n' })}\n`;

export function parseArreteDpeCsv(content: string): ArreteDpeRow[] {
  const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    throw new Error(`Erreur de parsing CSV : ${parsed.errors[0]?.message ?? 'erreur inconnue'}`);
  }
  const rows = z.array(zArreteDpeRow).parse(parsed.data);
  assertUniqueIdentifiants(rows);
  return rows;
}

// ---------------------------------------------------------------------------
// Diff against the database
// ---------------------------------------------------------------------------

export type NetworkDpeValues = Pick<DB['reseaux_de_chaleur'], 'contenu CO2' | 'contenu CO2 ACV' | 'Moyenne-annee-DPE' | 'Taux EnR&R'>;

export type ExistingNetwork = Pick<DB['reseaux_de_chaleur'], 'id_fcu' | 'Identifiant reseau'> & NetworkDpeValues;

export type NetworkChange = {
  after: NetworkDpeValues;
  before: NetworkDpeValues;
  id_fcu: number;
  identifiant: string | null;
};

export type ArreteDpeChanges = {
  resets: NetworkChange[];
  unknownIdentifiants: string[];
  updates: NetworkChange[];
};

const dpeFields = [
  'contenu CO2',
  'contenu CO2 ACV',
  'Moyenne-annee-DPE',
  'Taux EnR&R',
] as const satisfies readonly (keyof NetworkDpeValues)[];

const emptyDpeValues: NetworkDpeValues = {
  'contenu CO2': null,
  'contenu CO2 ACV': null,
  'Moyenne-annee-DPE': null,
  'Taux EnR&R': null,
};

const toDpeValues = (row: ArreteDpeRow): NetworkDpeValues => ({
  'contenu CO2': row.contenu_co2,
  'contenu CO2 ACV': row.contenu_co2_acv,
  'Moyenne-annee-DPE': row.annee_reference,
  'Taux EnR&R': row.taux_enrr,
});

const hasDifference = (change: NetworkChange) => dpeFields.some((field) => change.before[field] !== change.after[field]);

/**
 * Networks listed in the arrêté get its values; every other network is reset to null (values shown
 * under the arrêté reference must come from it). Arrêté rows without a matching network are reported.
 */
export function computeArreteDpeChanges(networks: ExistingNetwork[], rows: ArreteDpeRow[]): ArreteDpeChanges {
  const rowsByIdentifiant = new Map(rows.map((row) => [row.identifiant, row]));
  const networkIdentifiants = new Set(networks.map((network) => network['Identifiant reseau']));

  const changes = networks
    .map((network) => {
      const row = network['Identifiant reseau'] ? rowsByIdentifiant.get(network['Identifiant reseau']) : undefined;
      const change: NetworkChange = {
        after: row ? toDpeValues(row) : emptyDpeValues,
        before: {
          'contenu CO2': network['contenu CO2'],
          'contenu CO2 ACV': network['contenu CO2 ACV'],
          'Moyenne-annee-DPE': network['Moyenne-annee-DPE'],
          'Taux EnR&R': network['Taux EnR&R'],
        },
        id_fcu: network.id_fcu,
        identifiant: network['Identifiant reseau'],
      };
      return { change, isMatched: row !== undefined };
    })
    .filter(({ change }) => hasDifference(change));

  return {
    resets: changes.filter(({ isMatched }) => !isMatched).map(({ change }) => change),
    unknownIdentifiants: rows
      .map((row) => row.identifiant)
      .filter((identifiant) => !networkIdentifiants.has(identifiant))
      .sort(),
    updates: changes.filter(({ isMatched }) => isMatched).map(({ change }) => change),
  };
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

const networkTables = [
  { label: 'chaleur', suffix: 'C', table: 'reseaux_de_chaleur', tiles: 'reseaux-de-chaleur' },
  { label: 'froid', suffix: 'F', table: 'reseaux_de_froid', tiles: 'reseaux-de-froid' },
] as const;

type NetworkTableConfig = (typeof networkTables)[number];

type ApplyOptions = {
  dryRun: boolean;
  logger: Logger;
};

async function applyToTable(config: NetworkTableConfig, rows: ArreteDpeRow[], { dryRun, logger }: ApplyOptions): Promise<ArreteDpeChanges> {
  const tableRows = rows.filter((row) => row.identifiant.endsWith(config.suffix));
  const networks = await kdb
    .selectFrom(config.table)
    .select(['id_fcu', 'Identifiant reseau', ...dpeFields])
    .orderBy('id_fcu')
    .execute();
  const changes = computeArreteDpeChanges(networks, tableRows);

  logger.info(
    `Réseaux de ${config.label}: ${tableRows.length} dans l'arrêté, ${changes.updates.length} à mettre à jour, ${changes.resets.length} à réinitialiser, ${changes.unknownIdentifiants.length} identifiants absents de la base`
  );
  if (dryRun) {
    return changes;
  }

  // Replace rather than patch: reset the whole table, then write every listed network (the diff is only for the report)
  await kdb.transaction().execute(async (transaction) => {
    await transaction.updateTable(config.table).set(emptyDpeValues).execute();
    await Promise.all(
      tableRows.map((row) =>
        transaction.updateTable(config.table).set(toDpeValues(row)).where('Identifiant reseau', '=', row.identifiant).execute()
      )
    );
  });
  return changes;
}

/**
 * Applies the arrêté rows to both network tables (no tiles regeneration, see importArreteDpe).
 */
export const applyArreteDpe = async (rows: ArreteDpeRow[], options: ApplyOptions) =>
  Promise.all(networkTables.map((config) => applyToTable(config, rows, options).then((changes) => ({ changes, config }))));

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const formatValue = (value: number | string | null) => (value === null ? 'null' : typeof value === 'string' ? `"${value}"` : String(value));

const formatChange = (change: NetworkChange) =>
  [
    `### ${change.identifiant ?? `id_fcu ${change.id_fcu}`}`,
    ...dpeFields
      .filter((field) => change.before[field] !== change.after[field])
      .map((field) => `  ${field}: ${formatValue(change.before[field])} → ${formatValue(change.after[field])}`),
  ].join('\n');

const formatReport = (results: Awaited<ReturnType<typeof applyArreteDpe>>, dryRun: boolean) =>
  [
    `# Import arrêté DPE - ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    `Mode: ${dryRun ? 'dry-run' : 'live'}`,
    ...results.flatMap(({ config, changes }) => [
      '',
      `## Réseaux de ${config.label}`,
      `- mis à jour: ${changes.updates.length}`,
      `- réinitialisés (absents de l'arrêté): ${changes.resets.length}`,
      `- identifiants de l'arrêté absents de la base: ${changes.unknownIdentifiants.length}`,
      '',
      ...changes.updates.map(formatChange),
      '',
      '### Réinitialisés',
      ...changes.resets.map(formatChange),
      '',
      '### Absents de la base',
      ...changes.unknownIdentifiants,
    ]),
    '',
  ].join('\n');

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export const importArreteDpe = defineFileImportFunc(async ({ filepath, logger, options }) => {
  const dryRun = options?.dryRun ?? false;
  logger.info(`Début de l'import des données réglementaires de l'arrêté DPE (${filepath})`);
  logger.info(`Mode: ${dryRun ? 'dry-run' : 'live'}`);

  const rows = parseArreteDpeCsv(await readFile(filepath, 'utf8'));
  logger.info(`${rows.length} réseaux dans l'arrêté`);

  const results = await applyArreteDpe(rows, { dryRun, logger });

  const reportPath = `import-arrete-dpe-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
  await writeFile(reportPath, formatReport(results, dryRun), 'utf8');
  logger.info(`Rapport généré: ${reportPath}`);

  if (dryRun) {
    return;
  }
  await runTilesGeneration('reseaux-de-chaleur');
  await runTilesGeneration('reseaux-de-froid');
  logger.info('Import terminé, tuiles régénérées');
});
