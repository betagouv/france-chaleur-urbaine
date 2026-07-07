import { TRPCError } from '@trpc/server';
import { type Expression, expressionBuilder, type SqlBool } from 'kysely';

import { type ConversionEvents, type DB, type Insertable, kdb, sql } from '@/server/db/kysely';

import {
  CONVERSION_IP_RETENTION_DAYS,
  type ConversionChannel,
  type ConversionIpDisposition,
  type ConversionSourceConfig,
  type ConversionStatsGranularity,
} from '../constants';

/**
 * Service du module `conversion-tracking` — logique métier pure (aucune notion de HTTP/tRPC).
 * Cf. `AGENTS.md`.
 */

/** Colonnes de `conversion_events` fournies par l'appelant (client + IP/UA posés par la route). */
export type RecordConversionEventValues = Omit<Insertable<ConversionEvents>, 'id' | 'created_at'>;

/** Enregistre un événement de conversion (affichage / test d'adresse / demande). */
export async function recordConversionEvent(values: RecordConversionEventValues) {
  await kdb
    .insertInto('conversion_events')
    .values({
      ...values,
      // Si une règle bannit déjà cette IP, l'event entre directement exclu des stats (pas besoin de rejouer
      // le backfill). Détail de la résolution des règles : cf. `mostSpecificRuleExcludes`.
      excluded: values.ip ? mostSpecificRuleExcludes(sql<string>`${values.ip}::inet`) : false,
    })
    .execute();
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
  const createdAt = expressionBuilder<DB, 'conversion_events'>().ref('created_at');
  const period = sql<string>`to_char(date_trunc(${sql.lit(granularity)}, ${createdAt}), ${sql.lit(periodFormat)})`;
  const periodGroup = sql`date_trunc(${sql.lit(granularity)}, ${createdAt})`;

  const [eventRows, sources, knownRoutes] = await Promise.all([
    kdb
      .selectFrom('conversion_events')
      .select((eb) => [
        'source',
        'route',
        period.as('period'),
        eb.fn.countAll<number>().filterWhere('type', '=', 'display').as('displays'),
        eb.fn.countAll<number>().filterWhere('type', '=', 'address_test').as('tests'),
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([eb('type', '=', 'address_test'), eb('eligible', '=', true)]))
          .as('tests_eligible'),
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([eb('type', '=', 'address_test'), eb('eligible', '=', false)]))
          .as('tests_not_eligible'),
        eb.fn.countAll<number>().filterWhere('type', '=', 'demand').as('demands'),
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([eb('type', '=', 'demand'), eb('eligible', '=', true)]))
          .as('demands_eligible'),
        eb.fn.count<number>('ip').distinct().as('distinct_ip'),
      ])
      .where('created_at', '>=', dateFrom)
      .where('created_at', '<=', dateTo)
      .where('excluded', '=', false)
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
      .where('excluded', '=', false)
      .where('created_at', '>=', sql<Date>`now() - interval '12 months'`)
      .execute(),
  ]);

  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const sourceCreatedAt = (id: string | null): string | null => (id ? (sourceById.get(id)?.created_at.toISOString() ?? null) : null);

  const rows = eventRows.map((r): ConversionStatRow => {
    const { demands, displays, tests } = r;
    return {
      channel: getChannel(r.source, r.route),
      demandRate: tests > 0 ? demands / tests : null,
      demands,
      demandsEligible: r.demands_eligible,
      displays,
      distinctIp: r.distinct_ip,
      host: r.host ?? null,
      label: r.source ? (sourceById.get(r.source)?.label ?? r.source) : r.route,
      page: r.page ?? null,
      period: r.period,
      route: r.route,
      source: r.source,
      sourceCreatedAt: sourceCreatedAt(r.source),
      testRate: displays > 0 ? tests / displays : null,
      tests,
      testsEligible: r.tests_eligible,
      testsNotEligible: r.tests_not_eligible,
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
 * Valide/normalise une IP ou plage CIDR via Postgres (`inet`, source de vérité IPv4/IPv6).
 * Lève `BAD_REQUEST` sur une saisie invalide plutôt que d'exposer l'erreur SQL brute.
 */
async function normalizeInet(value: string): Promise<string> {
  try {
    // `::text` explicite → forme canonique avec masklen (`1.1.1.1/32`), cohérente avec les `ip::text`
    // renvoyés ailleurs (upsert, getSuspiciousIps, listIpRules).
    const { rows } = await sql<{ ip: string }>`select ${value}::inet::text as ip`.execute(kdb);
    return rows[0].ip;
  } catch {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `IP ou plage CIDR invalide : ${value}` });
  }
}

/**
 * Vrai si la règle la plus spécifique (`masklen` max) couvrant `ip` est un `exclude`. `ip` = expression SQL
 * `inet`. C'est la sémantique unique du flag `excluded` : un `keep` en /32 gagne sur un `exclude` en /24 ;
 * aucune règle → non exclu. La sous-requête est buildée (colonnes/enum type-checkés) ; seuls `<<=`, `masklen`
 * et `coalesce` (absents de Kysely) restent en SQL brut.
 */
const mostSpecificRuleExcludes = (ip: Expression<string | null>) => {
  const rule = expressionBuilder<DB, never>()
    .selectFrom('conversion_ip_rules as r')
    .select((eb) => eb('r.disposition', '=', sql.lit<ConversionIpDisposition>('exclude')).as('is_exclude'))
    .where((eb) => sql<SqlBool>`${ip} <<= ${eb.ref('r.ip')}`)
    .orderBy((eb) => sql`masklen(${eb.ref('r.ip')}) desc`)
    .limit(1);
  return sql<boolean>`coalesce(${rule}, false)`;
};

/**
 * Réconcilie `conversion_events.excluded` sur les events d'une plage après une modif de règle : recalcule le
 * flag = « couvert par un `exclude` le plus spécifique ». Ne met à jour que les lignes qui basculent (renvoie
 * leur nombre). Gère uniformément ban / keep / suppression. Les events purgés (IP nulle) restent figés.
 */
async function reconcileExcludedForRange(trx: typeof kdb, cidr: string): Promise<number> {
  const shouldExclude = mostSpecificRuleExcludes(expressionBuilder<DB, 'conversion_events'>().ref('conversion_events.ip'));
  const result = await trx
    .updateTable('conversion_events')
    .set({ excluded: shouldExclude })
    .where((eb) => sql<SqlBool>`${eb.ref('ip')} <<= ${cidr}::inet`)
    .where((eb) => sql<SqlBool>`${eb.ref('excluded')} is distinct from ${shouldExclude}`)
    .executeTakeFirst();
  return Number(result.numUpdatedRows ?? 0);
}

export type SuspiciousIpRow = {
  ip: string;
  events: number;
  displays: number;
  tests: number;
  demands: number;
  /** tests / affichages (null si aucun affichage). Un ratio élevé (≫ 1) signale du spam d'`address_test`. */
  testPerDisplay: number | null;
  distinctRoutes: number;
  distinctDays: number;
  firstSeen: string;
  lastSeen: string;
  /** Disposition de la règle la plus spécifique couvrant l'IP (`null` = non statuée). */
  ruleDisposition: ConversionIpDisposition | null;
  ruleReason: string | null;
};

/**
 * IP suspectes sur une période : agrégat par IP trié par nb de tests, avec les signaux d'abus
 * (ratio tests/affichages, nb de routes/jours, demandes) et la règle courante. Filtrable par
 * `source` / `route` / `host` (identifier les IP derrière une source pourrie ; passer `minTests: 0`).
 * Query builder (colonnes/enum type-checkés) ; seuls `<<=` et `masklen` (absents de Kysely) restent en SQL brut.
 */
export async function getSuspiciousIps(params: {
  dateFrom: Date;
  dateTo: Date;
  minTests: number;
  limit: number;
  source?: string;
  route?: string;
  host?: string;
}): Promise<SuspiciousIpRow[]> {
  const { dateFrom, dateTo, minTests, limit, source, route, host } = params;

  const rows = await kdb
    .selectFrom('conversion_events as ce')
    .where('ce.ip', 'is not', null)
    .where('ce.created_at', '>=', dateFrom)
    .where('ce.created_at', '<=', dateTo)
    .$if(source !== undefined, (qb) => qb.where('ce.source', '=', source!))
    .$if(route !== undefined, (qb) => qb.where('ce.route', '=', route!))
    .$if(host !== undefined, (qb) => qb.where('ce.host', '=', host!))
    .groupBy('ce.ip')
    .having((eb) => eb.fn.countAll().filterWhere('ce.type', '=', 'address_test'), '>=', minTests)
    .select((eb) => [
      sql<string>`${eb.ref('ce.ip')}::text`.as('ip'),
      eb.fn.countAll<number>().as('events'),
      eb.fn.countAll<number>().filterWhere('ce.type', '=', 'display').as('displays'),
      eb.fn.countAll<number>().filterWhere('ce.type', '=', 'address_test').as('tests'),
      eb.fn.countAll<number>().filterWhere('ce.type', '=', 'demand').as('demands'),
      eb.fn.count<number>('ce.route').distinct().as('distinct_routes'),
      eb.fn
        .count<number>(sql`date_trunc('day', ${eb.ref('ce.created_at')})`)
        .distinct()
        .as('distinct_days'),
      eb.fn.min('ce.created_at').as('first_seen'),
      eb.fn.max('ce.created_at').as('last_seen'),
      eb
        .selectFrom('conversion_ip_rules as r')
        .select('r.disposition')
        .where((sub) => sql<SqlBool>`${sub.ref('ce.ip')} <<= ${sub.ref('r.ip')}`)
        .orderBy((eb) => sql`masklen(${eb.ref('r.ip')}) desc`)
        .limit(1)
        .as('rule_disposition'),
      eb
        .selectFrom('conversion_ip_rules as r')
        .select('r.reason')
        .where((sub) => sql<SqlBool>`${sub.ref('ce.ip')} <<= ${sub.ref('r.ip')}`)
        .orderBy((eb) => sql`masklen(${eb.ref('r.ip')}) desc`)
        .limit(1)
        .as('rule_reason'),
    ])
    .orderBy((eb) => eb.fn.countAll().filterWhere('ce.type', '=', 'address_test'), 'desc')
    .limit(limit)
    .execute();

  return rows.map((r) => ({
    demands: r.demands,
    displays: r.displays,
    distinctDays: r.distinct_days,
    distinctRoutes: r.distinct_routes,
    events: r.events,
    // min/max sur un groupe non vide (>= 1 event par IP) → jamais null.
    firstSeen: new Date(r.first_seen ?? 0).toISOString(),
    ip: r.ip,
    lastSeen: new Date(r.last_seen ?? 0).toISOString(),
    ruleDisposition: r.rule_disposition,
    ruleReason: r.rule_reason,
    testPerDisplay: r.displays > 0 ? r.tests / r.displays : null,
    tests: r.tests,
  }));
}

/** Règles IP/CIDR (bannir / conserver) avec l'e-mail de l'admin auteur, si encore présent. */
export async function listIpRules() {
  return await kdb
    .selectFrom('conversion_ip_rules')
    .leftJoin('users', 'users.id', 'conversion_ip_rules.created_by')
    .select((eb) => [
      sql<string>`${eb.ref('conversion_ip_rules.ip')}::text`.as('ip'),
      'conversion_ip_rules.disposition',
      'conversion_ip_rules.reason',
      'conversion_ip_rules.created_at',
      'users.email as createdByEmail',
    ])
    .orderBy('conversion_ip_rules.disposition', 'asc')
    .orderBy('conversion_ip_rules.created_at', 'desc')
    .execute();
}

/**
 * Crée / met à jour une règle sur une IP/plage CIDR, puis réconcilie `excluded` sur la plage (nettoie les
 * stats et fige l'exclusion avant purge). `changedEvents` = nb d'events dont l'exclusion a basculé.
 */
export async function upsertIpRule(params: { ip: string; disposition: ConversionIpDisposition; reason: string; createdBy: string }) {
  const ip = await normalizeInet(params.ip);
  return await kdb.transaction().execute(async (trx) => {
    const rule = await trx
      .insertInto('conversion_ip_rules')
      .values({ created_by: params.createdBy, disposition: params.disposition, ip: sql<string>`${ip}::inet`, reason: params.reason })
      .onConflict((oc) =>
        oc.column('ip').doUpdateSet({
          created_at: new Date(),
          created_by: params.createdBy,
          disposition: params.disposition,
          reason: params.reason,
        })
      )
      .returning((eb) => [sql<string>`${eb.ref('ip')}::text`.as('ip'), 'disposition', 'reason'])
      .executeTakeFirstOrThrow();
    const changedEvents = await reconcileExcludedForRange(trx, ip);
    return { ...rule, changedEvents };
  });
}

/**
 * Supprime la règle d'une IP/plage, puis réconcilie `excluded` sur la plage (les events redeviennent comptés
 * s'ils ne sont plus couverts par une autre règle `exclude`). Les events purgés (IP nulle) restent figés.
 */
export async function removeIpRule(rawIp: string) {
  const ip = await normalizeInet(rawIp);
  return await kdb.transaction().execute(async (trx) => {
    await trx
      .deleteFrom('conversion_ip_rules')
      .where((eb) => sql<SqlBool>`${eb.ref('ip')} = ${ip}::inet`)
      .execute();
    const changedEvents = await reconcileExcludedForRange(trx, ip);
    return { changedEvents, ip };
  });
}

/**
 * Purge les données d'anti-abus (IP/UA) des événements plus vieux que `retentionDays`.
 * `host` est de l'analytics → conservé. Les compteurs restent intacts.
 */
export async function purgeOldConversionEventIps(retentionDays = CONVERSION_IP_RETENTION_DAYS): Promise<number> {
  const result = await kdb
    .updateTable('conversion_events')
    .set({ ip: null, user_agent: null })
    .where('ip', 'is not', null)
    .where('created_at', '<', sql<Date>`now() - ${sql.lit(`${retentionDays} days`)}::interval`)
    .executeTakeFirst();
  return Number(result.numUpdatedRows ?? 0);
}
