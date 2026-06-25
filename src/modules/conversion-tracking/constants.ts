import { z } from 'zod';

/**
 * Constantes + schémas Zod du module `conversion-tracking`.
 * Cf. `AGENTS.md`.
 */

export const conversionEventTypes = ['display', 'address_test', 'demand'] as const;
export type ConversionEventType = (typeof conversionEventTypes)[number];

export const conversionStatsGranularities = ['day', 'month'] as const;
export type ConversionStatsGranularity = (typeof conversionStatsGranularities)[number];

/** Canal de conversion, dérivé de l'event (`source` présente ou `route` `/iframe/*` = iframe). */
export const conversionChannels = ['iframe', 'internal'] as const;
export type ConversionChannel = (typeof conversionChannels)[number];

/** Snapshot des params d'une iframe déployée (forme libre — clés de `carteIframeParams`). */
export type ConversionSourceConfig = Record<string, unknown>;

/** Event émis depuis le client (`recordEvent`). L'IP / UA sont ajoutés côté serveur. */
export const zRecordConversionEventInput = z.object({
  eligible: z.boolean().optional(),
  /** Page embarquante (best-effort, domaine + pathname) : referrer en iframe, `?host=` après redirection. */
  host: z.string().trim().max(2000).optional(),
  /** Drill : pathname exact de la page (ex. `/villes/charleville`). */
  page: z.string().trim().min(1).max(2000),
  /** Axe d'agrégation interne : pattern de route Next (ex. `/villes/[ville]`). */
  route: z.string().trim().min(1).max(2000),
  source: z.string().trim().min(1).max(100).nullish(),
  type: z.enum(conversionEventTypes),
});
export type RecordConversionEventInput = z.infer<typeof zRecordConversionEventInput>;

export const zCreateConversionSourceInput = z.object({
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  label: z.string().trim().min(1).max(200),
});

export const zUpdateConversionSourceInput = z.object({
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  id: z.uuidv4(),
  label: z.string().trim().min(1).max(200).optional(),
});

export const zArchiveConversionSourceInput = z.object({
  id: z.uuidv4(),
});

export const zListConversionSourcesInput = z
  .object({
    includeArchived: z.boolean().default(false),
  })
  .default({ includeArchived: false });

export const zGetConversionStatsInput = z.object({
  /** Filtre iframe / pages internes (dérivé de l'event, pas du registre). */
  channel: z.enum(conversionChannels).optional(),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  granularity: z.enum(conversionStatsGranularities).default('month'),
  /** Drills optionnels : `page` (pathname exact) et/ou `host` (site embarquant). */
  groupByHost: z.boolean().default(false),
  groupByPage: z.boolean().default(false),
  source: z.string().trim().min(1).max(100).optional(),
});
export type GetConversionStatsInput = z.infer<typeof zGetConversionStatsInput>;
