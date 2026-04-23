import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { sql } from '@/server/db/kysely';

/**
 * Patch à fusionner dans `demands.legacy_values` via `mergeLegacyValues`.
 * Toutes les clés sont optionnelles ; `null` efface explicitement la valeur JSONB.
 */
export type LegacyValuesPatch = {
  [K in keyof AirtableLegacyRecord]?: AirtableLegacyRecord[K] | null;
};

/**
 * Construit l'expression SQL `legacy_values || <patch>::jsonb` avec un typage strict
 * sur les clés pour attraper les fautes de frappe et les valeurs incompatibles.
 */
export const mergeLegacyValues = (patch: LegacyValuesPatch) => sql<string>`legacy_values || ${JSON.stringify(patch)}::jsonb`;
