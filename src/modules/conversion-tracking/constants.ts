import { z } from 'zod';

import { businessRules } from '@/modules/app/business-rules';

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

/** Rétention (jours) des données d'anti-abus (IP / user-agent) des `conversion_events` avant purge RGPD par cron. */
export const CONVERSION_IP_RETENTION_DAYS = businessRules.conversionIpRetentionDays.value;

/** Disposition d'une règle IP : retirée des stats (`exclude`) ou IP légitime connue à conserver (`keep`). */
export const conversionIpDispositions = ['exclude', 'keep'] as const;
export type ConversionIpDisposition = (typeof conversionIpDispositions)[number];

/** Détection anti-abus : IP suspectes sur une période, filtrables par source / route / site hôte. */
export const zGetSuspiciousIpsInput = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  /** Filtre : site embarquant (drill iframe). */
  host: z.string().trim().min(1).max(2000).optional(),
  /** Nombre max d'IP renvoyées (tri par tests décroissant). */
  limit: z.number().int().min(1).max(500).default(50),
  /** Seuil de tests (`address_test`) au-delà duquel une IP est listée. `0` (source ciblée) = toutes les IP. */
  minTests: z.number().int().min(0).default(50),
  /** Filtre : pattern de route Next (ex. `/villes/[ville]`). */
  route: z.string().trim().min(1).max(2000).optional(),
  /** Filtre : intégration iframe (`?source=`) — pour identifier les IP derrière une source pourrie. */
  source: z.string().trim().min(1).max(100).optional(),
});
export type GetSuspiciousIpsInput = z.infer<typeof zGetSuspiciousIpsInput>;

/** Crée / met à jour une règle sur une IP ou plage CIDR (IPv4/IPv6). Le format `inet` est validé côté serveur. */
export const zUpsertIpRuleInput = z.object({
  disposition: z.enum(conversionIpDispositions),
  ip: z.string().trim().min(1).max(50),
  reason: z.string().trim().min(1).max(500),
});

export const zRemoveIpRuleInput = z.object({
  ip: z.string().trim().min(1).max(50),
});

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
