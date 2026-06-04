import { type ConversionEvents, type Insertable, kdb, sql } from '@/server/db/kysely';

import type { ConversionChannel, ConversionSourceConfig, ConversionStatsGranularity } from '../constants';

/**
 * Service du module `conversion-tracking` — logique métier pure (aucune notion de HTTP/tRPC).
 * Cf. `AGENTS.md`.
 */

/** Colonnes de `conversion_events` fournies par l'appelant (client + IP/UA posés par la route). */
export type RecordConversionEventValues = Omit<Insertable<ConversionEvents>, 'id' | 'created_at'>;

/** Enregistre un événement de conversion (affichage / test d'adresse / demande). */
export async function recordConversionEvent(values: RecordConversionEventValues) {
  await kdb.insertInto('conversion_events').values(values).execute();
}

export async function listConversionSources({ includeArchived }: { includeArchived: boolean }) {
  return await kdb
    .selectFrom('conversion_sources')
    .select(['id', 'label', 'config', 'archived_at', 'created_at'])
    .$if(!includeArchived, (qb) => qb.where('archived_at', 'is', null))
    .orderBy('label', 'asc')
    .execute();
}

export async function createConversionSource(params: { label: string; config?: ConversionSourceConfig | null }) {
  return await kdb
    .insertInto('conversion_sources')
    .values({
      config: params.config ? JSON.stringify(params.config) : null,
      label: params.label,
    })
    .returning(['id', 'label'])
    .executeTakeFirstOrThrow();
}

export async function updateConversionSource(params: { id: string; label?: string; config?: ConversionSourceConfig | null }) {
  return await kdb
    .updateTable('conversion_sources')
    .set({
      ...(params.label !== undefined ? { label: params.label } : {}),
      ...(params.config !== undefined ? { config: params.config ? JSON.stringify(params.config) : null } : {}),
      updated_at: new Date(),
    })
    .where('id', '=', params.id)
    .returning(['id', 'label'])
    .executeTakeFirstOrThrow();
}

export async function archiveConversionSource(id: string) {
  return await kdb
    .updateTable('conversion_sources')
    .set({ archived_at: new Date(), updated_at: new Date() })
    .where('id', '=', id)
    .returning(['id', 'label'])
    .executeTakeFirstOrThrow();
}

/** Canal de conversion : intégration (`source`) ou iframe servie sur `/iframe/*`, sinon page interne. */
const getChannel = (source: string | null, route: string | null): ConversionChannel =>
  source !== null || route?.startsWith('/iframe/') ? 'iframe' : 'internal';

export type ConversionStatRow = {
  /** Id (uuid) d'intégration (`?source=`) ; `null` = pas de source (page interne, iframe sans source). */
  source: string | null;
  /** Pattern de route Next (`/villes/[ville]`) ; `null` sur une ligne à zéro issue du registre. */
  route: string | null;
  channel: ConversionChannel;
  /** Label du registre pour une intégration, sinon la route. */
  label: string;
  /** Date de création de l'intégration (registre), `null` pour une route interne ou une source hors registre. */
  sourceCreatedAt: string | null;
  /** Source reçue mais absente du registre `conversion_sources` (id erroné / intégration non enregistrée). */
  unregistered: boolean;
  /** Drill : pathname exact. `null` si non ventilé (`groupByPage=false`). */
  page: string | null;
  /** Drill : site embarquant. `null` si non ventilé (`groupByHost=false`) ou page interne. */
  host: string | null;
  /** `null` sur une ligne à zéro (aucun event sur la période). */
  period: string | null;
  displays: number;
  tests: number;
  testsEligible: number;
  testsNotEligible: number;
  demands: number;
  demandsEligible: number;
  distinctIp: number;
  /** tests / affichages (null si aucun affichage). */
  testRate: number | null;
  /** demandes / tests. */
  demandRate: number | null;
};

const zeroStatRow = (
  partial: Pick<ConversionStatRow, 'source' | 'route' | 'channel' | 'label'> & { sourceCreatedAt?: string | null }
): ConversionStatRow => ({
  ...partial,
  demandRate: null,
  demands: 0,
  demandsEligible: 0,
  displays: 0,
  distinctIp: 0,
  host: null,
  page: null,
  period: null,
  sourceCreatedAt: partial.sourceCreatedAt ?? null,
  testRate: null,
  tests: 0,
  testsEligible: 0,
  testsNotEligible: 0,
  unregistered: false,
});

/**
 * Agrège le funnel de conversion depuis `conversion_events` (table unique).
 * Niveau 1 = `source` (intégration) sinon `route` (pattern Next) ; drills optionnels par `page` et/ou `host`.
 * Lignes à zéro : intégrations actives du registre sans event sur la période, et routes internes vues sur
 * les 12 derniers mois mais muettes sur la période (détection de tracking cassé / intégration non déployée).
 */
export async function getConversionStats(params: {
  dateFrom: Date;
  dateTo: Date;
  granularity: ConversionStatsGranularity;
  groupByPage?: boolean;
  groupByHost?: boolean;
  source?: string;
  channel?: ConversionChannel;
}): Promise<ConversionStatRow[]> {
  const { dateFrom, dateTo, granularity, groupByPage = false, groupByHost = false, source, channel } = params;
  const periodFormat = granularity === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
  const period = sql<string>`to_char(date_trunc(${sql.lit(granularity)}, ${sql.ref('created_at')}), ${sql.lit(periodFormat)})`;
  const periodGroup = sql`date_trunc(${sql.lit(granularity)}, ${sql.ref('created_at')})`;

  const [eventRows, sources, knownRoutes] = await Promise.all([
    kdb
      .selectFrom('conversion_events')
      .select((eb) => [
        'source',
        'route',
        period.as('period'),
        eb.fn.countAll<string>().filterWhere('type', '=', 'display').as('displays'),
        eb.fn.countAll<string>().filterWhere('type', '=', 'address_test').as('tests'),
        eb.fn
          .countAll<string>()
          .filterWhere(eb.and([eb('type', '=', 'address_test'), eb('eligible', '=', true)]))
          .as('tests_eligible'),
        eb.fn
          .countAll<string>()
          .filterWhere(eb.and([eb('type', '=', 'address_test'), eb('eligible', '=', false)]))
          .as('tests_not_eligible'),
        eb.fn.countAll<string>().filterWhere('type', '=', 'demand').as('demands'),
        eb.fn
          .countAll<string>()
          .filterWhere(eb.and([eb('type', '=', 'demand'), eb('eligible', '=', true)]))
          .as('demands_eligible'),
        sql<string>`count(distinct ${sql.ref('ip')})`.as('distinct_ip'),
      ])
      .where('created_at', '>=', dateFrom)
      .where('created_at', '<=', dateTo)
      .$if(!!source, (qb) => qb.where('source', '=', source!))
      .groupBy(['source', 'route', periodGroup])
      .$if(groupByPage, (qb) => qb.select('page').groupBy('page'))
      .$if(groupByHost, (qb) => qb.select('host').groupBy('host'))
      .execute(),
    kdb.selectFrom('conversion_sources').select(['id', 'label', 'archived_at', 'created_at']).execute(),
    kdb
      .selectFrom('conversion_events')
      .select('route')
      .distinct()
      .where('source', 'is', null)
      .where('created_at', '>=', sql<Date>`now() - interval '12 months'`)
      .execute(),
  ]);

  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const sourceCreatedAt = (id: string | null): string | null => (id ? (sourceById.get(id)?.created_at.toISOString() ?? null) : null);

  const rows = eventRows.map((r): ConversionStatRow => {
    const displays = Number(r.displays);
    const tests = Number(r.tests);
    const demands = Number(r.demands);
    return {
      channel: getChannel(r.source, r.route),
      demandRate: tests > 0 ? demands / tests : null,
      demands,
      demandsEligible: Number(r.demands_eligible),
      displays,
      distinctIp: Number(r.distinct_ip),
      host: r.host ?? null,
      label: r.source ? (sourceById.get(r.source)?.label ?? r.source) : r.route,
      page: r.page ?? null,
      period: r.period,
      route: r.route,
      source: r.source,
      sourceCreatedAt: sourceCreatedAt(r.source),
      testRate: displays > 0 ? tests / displays : null,
      tests,
      testsEligible: Number(r.tests_eligible),
      testsNotEligible: Number(r.tests_not_eligible),
      unregistered: r.source ? !sourceById.has(r.source) : false,
    };
  });

  // Lignes à zéro (uniquement sans filtre `source` explicite, qui restreint déjà l'axe).
  if (!source) {
    const seenKeys = new Set(rows.map((r) => r.source ?? r.route));
    for (const s of sources) {
      if (!s.archived_at && !seenKeys.has(s.id)) {
        rows.push(
          zeroStatRow({ channel: 'iframe', label: s.label, route: null, source: s.id, sourceCreatedAt: s.created_at.toISOString() })
        );
      }
    }
    for (const { route } of knownRoutes) {
      if (!seenKeys.has(route)) {
        rows.push(zeroStatRow({ channel: getChannel(null, route), label: route, route, source: null }));
      }
    }
  }

  return rows
    .filter((r) => !channel || r.channel === channel)
    .sort(
      (a, b) =>
        a.channel.localeCompare(b.channel) ||
        a.label.localeCompare(b.label) ||
        (a.page ?? '').localeCompare(b.page ?? '') ||
        (a.host ?? '').localeCompare(b.host ?? '') ||
        (a.period ?? '').localeCompare(b.period ?? '')
    );
}

/**
 * Purge les données d'anti-abus (IP/UA) des événements plus vieux que `retentionDays`.
 * `host` est de l'analytics → conservé. Les compteurs restent intacts.
 */
export async function purgeOldConversionEventIps(retentionDays = 90): Promise<number> {
  const result = await kdb
    .updateTable('conversion_events')
    .set({ ip: null, user_agent: null })
    .where('ip', 'is not', null)
    .where('created_at', '<', sql<Date>`now() - ${sql.lit(`${retentionDays} days`)}::interval`)
    .executeTakeFirst();
  return Number(result.numUpdatedRows ?? 0);
}
