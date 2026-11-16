import { TRPCError } from '@trpc/server';
import type { Expression, ExpressionBuilder, SqlBool } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

import { businessRules } from '@/modules/app/business-rules';
import type { NetworkType } from '@/modules/reseaux/constants';
import { reminderJsonAggSQL } from '@/modules/reseaux/server/reminders';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { userRolesWithPermissionsHeatNetwork } from '@/types/enum/UserRole';
import { dayjs } from '@/utils/date';

import {
  DEMAND_HISTORY_START,
  type DemandStatus,
  demandStatusDefault,
  demandStatuses,
  demandStatusGroups,
  type NetworkTrackingState,
} from '../constants';

const TIMEZONE = 'Europe/Paris';
const SECONDS_PER_DAY = 86_400;
const ACTIVITY_MONTHS = 18;

type NetworkRef = {
  networkId: number;
  networkType: NetworkType;
};

/**
 * Admin: tracking indicators of every heat network (existing or under construction), with its accounts, reminders and notes.
 */
export const listNetworkTracking = async () => {
  const now = new Date();
  const rows = await networkSummariesQuery(now).execute();
  return rows.map((row) => toNetworkTrackingSummary(row, now));
};

/**
 * Admin: tracking detail of one network (indicators, monthly activity, quarterly response, breakdown by status).
 */
export const getNetworkTracking = async (network: NetworkRef) => {
  const now = new Date();
  const activityMonths = getActivityMonths(now);
  const activityStart = dayjs.tz(`${activityMonths[0]}-01`, TIMEZONE).toDate();

  const [summaryRow, receivedByMonth, handledByMonth, quarters, statuses] = await Promise.all([
    networkSummariesQuery(now, network).executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Réseau introuvable' })),
    receivedByMonthQuery(network, activityStart).execute(),
    handledByMonthQuery(network, activityStart).execute(),
    quartersQuery(network, activityStart).execute(),
    statusesQuery(network, now).execute(),
  ]);

  return {
    months: activityMonths.map((month) => ({
      handled: handledByMonth.find((row) => row.month === month)?.count ?? 0,
      month,
      received: receivedByMonth.find((row) => row.month === month)?.count ?? 0,
    })),
    quarters: quarters.map((row) => ({
      medianResponseDays: secondsToDays(row.median_response_seconds),
      quarter: row.quarter,
      received: row.received,
      responded: row.responded,
    })),
    statuses: demandStatuses
      .map((status) => statuses.find((row) => row.status === status.label))
      .filter((row) => row !== undefined)
      .map((row) => ({
        count: row.count,
        medianAgeDays: secondsToDays(row.median_age_seconds),
        status: row.status,
        stuckCount: row.stuck_count,
      })),
    summary: toNetworkTrackingSummary(summaryRow, now),
  };
};

// --- Queries ---

/**
 * A manager action is an update or an email by an account allowed to process demands, or an update through the partner API.
 * The role is the author's current one: `demand_updated` is shared with admins, the audit log does not keep the role at the time.
 */
const isManagerAction = (eb: ExpressionBuilder<DB & { e: DB['events']; u: DB['users'] }, 'e' | 'u'>): Expression<SqlBool> =>
  eb.or([
    eb('e.type', '=', 'api_demand_updated'),
    eb.and([eb('e.type', 'in', ['demand_updated', 'demand_email_sent']), eb('u.role', 'in', userRolesWithPermissionsHeatNetwork)]),
  ]);

/**
 * One row per validated demand assigned to a network, with its timeline derived from the audit log:
 * `started_at` = when its current network received it (validation, or last reassignment), `responded_at` / `last_action_at` = first / last manager action since then.
 * A demand validated before the audit log existed has no `started_at` and stays out of the response metrics.
 */
const demandTimelineQuery = (network?: NetworkRef) =>
  kdb
    .selectFrom('demands as d')
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom('events as e')
          .select((eventBuilder) =>
            eventBuilder
              .fn<Date | null>('greatest', [
                eventBuilder.fn.min('e.created_at').filterWhere('e.type', '=', 'demand_validated'),
                eventBuilder.fn.max('e.created_at').filterWhere('e.type', '=', 'demand_assignment_changed'),
              ])
              .as('started_at')
          )
          .where('e.context_type', '=', 'demand')
          .where((eventBuilder) => eventBuilder('e.context_id', '=', eventBuilder.cast<string>('d.id', 'text')))
          .where('e.type', 'in', ['demand_validated', 'demand_assignment_changed'])
          .as('starts'),
      (join) => join.onTrue()
    )
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom('events as e')
          .leftJoin('users as u', 'u.id', 'e.author_id')
          .select((eventBuilder) => [
            eventBuilder.fn.min('e.created_at').as('responded_at'),
            eventBuilder.fn.max('e.created_at').as('last_action_at'),
          ])
          .where('e.context_type', '=', 'demand')
          .where((eventBuilder) => eventBuilder('e.context_id', '=', eventBuilder.cast<string>('d.id', 'text')))
          .where(isManagerAction)
          .where((eventBuilder) =>
            eventBuilder.or([
              eventBuilder('starts.started_at', 'is', null),
              eventBuilder('e.created_at', '>=', eventBuilder.ref('starts.started_at')),
            ])
          )
          .as('actions'),
      (join) => join.onTrue()
    )
    .where('d.validated', '=', true)
    .where('d.deleted_at', 'is', null)
    .where('d.network_id', 'is not', null)
    .where('d.network_type', 'is not', null)
    .where((eb) =>
      network ? eb.and([eb('d.network_id', '=', network.networkId), eb('d.network_type', '=', network.networkType)]) : eb.lit(true)
    )
    .select((eb) => {
      const demandDate = eb.cast<Date>(eb.ref('d.legacy_values', '->>').key('Date de la demande'), 'timestamptz');
      return [
        'd.id',
        'd.network_id',
        'd.network_type',
        'starts.started_at',
        'actions.responded_at',
        'actions.last_action_at',
        demandDate.as('demand_date'),
        eb.fn.coalesce('starts.started_at', demandDate).as('waiting_since'),
        eb
          .fn<DemandStatus>('coalesce', [
            eb.fn('nullif', [eb.ref('d.legacy_values', '->>').key('Status'), sql.lit('')]),
            sql.lit(demandStatusDefault),
          ])
          .as('status'),
      ];
    })
    .$narrowType<{ network_id: number; network_type: NetworkType }>();

type NetworkTable = 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction';

/**
 * Active accounts able to process the demands of the network:
 * a permission on the network itself or on the organization it belongs to, with a role allowed to process heat network demands
 * (same rule as `isUserResponsibleForDemand` for an assigned demand).
 * `via_organization` flags the accounts reaching the network only through its organization: usually not the ones reminded.
 * Accounts with a permission on the network come first, then most recently connected first.
 */
const networkUsersJson = (eb: ExpressionBuilder<DB, NetworkTable>, table: NetworkTable, networkType: NetworkType) => {
  const hasPermission = (
    userBuilder: ExpressionBuilder<DB & { u: DB['users'] }, NetworkTable | 'u'>,
    type: 'network' | 'organization'
  ): Expression<SqlBool> =>
    userBuilder.exists(
      userBuilder
        .selectFrom('user_permissions as up')
        .select('up.id')
        .whereRef('up.user_id', '=', 'u.id')
        .where('up.type', '=', type === 'network' ? networkType : 'organization')
        .where((permissionBuilder) =>
          permissionBuilder(
            'up.resource_id',
            '=',
            permissionBuilder.cast<string>(type === 'network' ? `${table}.id_fcu` : `${table}.organization_id`, 'text')
          )
        )
    );
  return jsonArrayFrom(
    eb
      .selectFrom('users as u')
      .leftJoin('email_blocked_contacts as ebc', (join) =>
        join.on((joinBuilder) => joinBuilder('ebc.email', '=', joinBuilder.fn<string>('lower', ['u.email'])))
      )
      .select(['u.id', 'u.email', 'u.last_connection', 'ebc.reason_code as email_blocked_reason'])
      .select((userBuilder) => userBuilder.not(hasPermission(userBuilder, 'network')).$castTo<boolean>().as('via_organization'))
      .where('u.active', '=', true)
      .where('u.role', 'in', userRolesWithPermissionsHeatNetwork)
      .where((userBuilder) => userBuilder.or([hasPermission(userBuilder, 'network'), hasPermission(userBuilder, 'organization')]))
      .orderBy('via_organization')
      .orderBy('u.last_connection', (order) => order.desc().nullsLast())
  );
};

const networksQuery = () =>
  kdb
    .selectFrom('reseaux_de_chaleur')
    .select(['id_fcu', 'nom_reseau', 'Identifiant reseau', 'notes', 'puissance_totale_MW'])
    .select((eb) => [
      sql.lit<NetworkType>('reseau_de_chaleur').as('network_type'),
      networkUsersJson(eb, 'reseaux_de_chaleur', 'reseau_de_chaleur').as('users'),
      reminderJsonAggSQL(eb, 'reseaux_de_chaleur', 'reseau_de_chaleur', 'demand').as('reminders'),
    ])
    .unionAll(
      kdb
        .selectFrom('zones_et_reseaux_en_construction')
        .select(['id_fcu', 'nom_reseau', 'Identifiant reseau', 'notes'])
        .select((eb) => [
          sql<number | null>`null`.as('puissance_totale_MW'), // networks under construction have no power yet
          sql.lit<NetworkType>('reseau_en_construction').as('network_type'),
          networkUsersJson(eb, 'zones_et_reseaux_en_construction', 'reseau_en_construction').as('users'),
          reminderJsonAggSQL(eb, 'zones_et_reseaux_en_construction', 'reseau_en_construction', 'demand').as('reminders'),
        ])
    );

const secondsBetween = (start: Expression<Date | null>, end: Expression<Date | null>) => sql<number>`extract(epoch from ${end} - ${start})`;

/**
 * A received demand awaits a response when a manager acted on it or when it is still pending.
 * The others never needed one from this network: ineligible demands are created as unrealisable, and a demand reassigned after it was handled keeps its status.
 */
const awaitsResponse = (eb: ExpressionBuilder<{ t: { responded_at: Date | null; status: DemandStatus } }, 't'>): Expression<SqlBool> =>
  eb.or([eb('t.responded_at', 'is not', null), eb('t.status', 'in', demandStatusGroups.pending)]);

/** One row per network: its own data, plus the aggregates of its demands when it has any. */
const networkSummariesQuery = (now: Date, network?: NetworkRef) => {
  const responseWindowStart = dayjs(now).subtract(businessRules.networkTrackingResponseWindowMonths.value, 'month').toDate();
  return kdb
    .with('timeline', () => demandTimelineQuery(network))
    .with('networks', networksQuery)
    .with('summaries', (db) =>
      db
        .selectFrom('timeline as t')
        .groupBy(['t.network_type', 't.network_id'])
        .select((eb) => [
          't.network_type',
          't.network_id',
          eb.fn.countAll<number>().as('total'),
          eb.fn.countAll<number>().filterWhere('t.status', 'in', demandStatusGroups.pending).as('pending'),
          eb.fn.countAll<number>().filterWhere('t.status', 'in', demandStatusGroups.inProgress).as('in_progress'),
          eb.fn.countAll<number>().filterWhere('t.status', 'in', demandStatusGroups.closed).as('closed'),
          eb.fn.min('t.demand_date').as('oldest_demand_at'),
          eb.fn.max('t.demand_date').as('newest_demand_at'),
          eb.fn.min('t.demand_date').filterWhere('t.status', 'in', demandStatusGroups.pending).as('oldest_pending_demand_at'),
          eb.fn.max('t.demand_date').filterWhere('t.status', 'in', demandStatusGroups.pending).as('newest_pending_demand_at'),
          eb.fn.min('t.waiting_since').filterWhere('t.status', 'in', demandStatusGroups.pending).as('oldest_pending_since'),
          eb.fn.max('t.last_action_at').as('last_action_at'),
          eb.fn
            .countAll<number>()
            .filterWhere((filterBuilder) =>
              filterBuilder.and([filterBuilder('t.started_at', '>=', responseWindowStart), awaitsResponse(filterBuilder)])
            )
            .as('recent_received'),
          eb.fn.count<number>('t.responded_at').filterWhere('t.started_at', '>=', responseWindowStart).as('recent_responded'),
          eb.fn
            .agg<number | null>('percentile_cont', [sql.lit(0.5)])
            .withinGroupOrderBy(secondsBetween(eb.ref('t.started_at'), eb.ref('t.responded_at')))
            .filterWhere('t.started_at', '>=', responseWindowStart)
            .as('median_response_seconds'),
        ])
    )
    .selectFrom('networks as n')
    .leftJoin('summaries as s', (join) => join.onRef('s.network_id', '=', 'n.id_fcu').onRef('s.network_type', '=', 'n.network_type'))
    .where((eb) =>
      network ? eb.and([eb('n.id_fcu', '=', network.networkId), eb('n.network_type', '=', network.networkType)]) : eb.lit(true)
    )
    .select((eb) => [
      'n.id_fcu',
      'n.network_type',
      'n.nom_reseau',
      'n.Identifiant reseau',
      'n.notes',
      'n.puissance_totale_MW',
      'n.users',
      'n.reminders',
      eb.fn.coalesce('s.total', eb.lit(0)).as('total'),
      eb.fn.coalesce('s.pending', eb.lit(0)).as('pending'),
      eb.fn.coalesce('s.in_progress', eb.lit(0)).as('in_progress'),
      eb.fn.coalesce('s.closed', eb.lit(0)).as('closed'),
      eb.fn.coalesce('s.recent_received', eb.lit(0)).as('recent_received'),
      eb.fn.coalesce('s.recent_responded', eb.lit(0)).as('recent_responded'),
      's.oldest_demand_at',
      's.newest_demand_at',
      's.oldest_pending_demand_at',
      's.newest_pending_demand_at',
      's.oldest_pending_since',
      's.last_action_at',
      's.median_response_seconds',
    ])
    .orderBy('n.network_type')
    .orderBy('n.id_fcu');
};

const monthOf = (timestamp: Expression<Date | null>) => sql<string>`to_char(${timestamp} at time zone ${sql.lit(TIMEZONE)}, 'YYYY-MM')`;

const receivedByMonthQuery = (network: NetworkRef, from: Date) =>
  kdb
    .with('timeline', () => demandTimelineQuery(network))
    .selectFrom('timeline as t')
    .select((eb) => [monthOf(eb.ref('t.waiting_since')).as('month'), eb.fn.countAll<number>().as('count')])
    .where('t.waiting_since', '>=', from)
    .groupBy('month');

/** Demands the managers of the network acted on, per month (a demand counts once per month). */
const handledByMonthQuery = (network: NetworkRef, from: Date) =>
  kdb
    .with('timeline', () => demandTimelineQuery(network))
    .selectFrom('timeline as t')
    .innerJoin('events as e', (join) =>
      join.on('e.context_type', '=', 'demand').on((eb) => eb('e.context_id', '=', eb.cast<string>('t.id', 'text')))
    )
    .leftJoin('users as u', 'u.id', 'e.author_id')
    .select((eb) => [monthOf(eb.ref('e.created_at')).as('month'), eb.fn.count<number>('t.id').distinct().as('count')])
    .where(isManagerAction)
    .where('e.created_at', '>=', from)
    .where((eb) => eb.or([eb('t.started_at', 'is', null), eb('e.created_at', '>=', eb.ref('t.started_at'))]))
    .groupBy('month');

const quartersQuery = (network: NetworkRef, from: Date) =>
  kdb
    .with('timeline', () => demandTimelineQuery(network))
    .selectFrom('timeline as t')
    .select((eb) => [
      sql<string>`to_char(${eb.ref('t.started_at')} at time zone ${sql.lit(TIMEZONE)}, 'YYYY-"T"Q')`.as('quarter'),
      eb.fn.countAll<number>().filterWhere(awaitsResponse).as('received'),
      eb.fn.count<number>('t.responded_at').as('responded'),
      eb.fn
        .agg<number | null>('percentile_cont', [sql.lit(0.5)])
        .withinGroupOrderBy(secondsBetween(eb.ref('t.started_at'), eb.ref('t.responded_at')))
        .as('median_response_seconds'),
    ])
    .where('t.started_at', '>=', from)
    .groupBy('quarter')
    .orderBy('quarter', 'desc');

/** Status carried by an update event: `Status` from the UI, `statut` from the partner API. */
const eventStatus = (data: Expression<unknown>) => sql<string | null>`coalesce(${data}->>'Status', ${data}->>'statut')`;

/**
 * Demands of the network by current status, with how long they have been in it.
 * The status date is its last recorded change; without one, the status dates from the demand itself (pending, or created since the audit log exists) or from `DEMAND_HISTORY_START` at the latest.
 */
const statusesQuery = (network: NetworkRef, now: Date) => {
  const historyStart = dayjs.tz(DEMAND_HISTORY_START, TIMEZONE).toDate();
  const stuckBefore = dayjs(now).subtract(businessRules.networkTrackingStuckMonths.value, 'month').toDate();
  return kdb
    .with('timeline', () => demandTimelineQuery(network))
    .with('status_events', (db) =>
      db
        .selectFrom('events as e')
        .select((eb) => [
          'e.context_id',
          'e.created_at',
          eventStatus(eb.ref('e.data')).as('status'),
          eb.fn
            .agg<string | null>('lag', [eventStatus(eb.ref('e.data'))])
            .over((over) => over.partitionBy('e.context_id').orderBy('e.created_at'))
            .as('previous_status'),
        ])
        .where('e.context_type', '=', 'demand')
        .where('e.type', 'in', ['demand_updated', 'api_demand_updated'])
        .where((eb) =>
          eb(
            'e.context_id',
            'in',
            eb.selectFrom('timeline').select((timeline) => timeline.cast<string>('timeline.id', 'text').as('id'))
          )
        )
        .where((eb) => eb(eventStatus(eb.ref('e.data')), 'is not', null))
    )
    .with('status_changes', (db) =>
      db
        .selectFrom('status_events')
        .select((eb) => ['context_id', eb.fn.max('created_at').as('changed_at')])
        .where((eb) => eb('previous_status', 'is distinct from', eb.ref('status')))
        .groupBy('context_id')
    )
    .with('current_statuses', (db) =>
      db
        .selectFrom('timeline as t')
        .leftJoin('status_changes as c', (join) => join.on((eb) => eb('c.context_id', '=', eb.cast<string>('t.id', 'text'))))
        .select((eb) => [
          't.status',
          eb.fn
            .coalesce(
              'c.changed_at',
              eb
                .case()
                .when(eb.or([eb('t.status', 'in', demandStatusGroups.pending), eb('t.demand_date', '>=', historyStart)]))
                .then(eb.ref('t.waiting_since'))
                .else(historyStart)
                .end()
            )
            .as('status_since'),
        ])
    )
    .selectFrom('current_statuses as s')
    .select((eb) => [
      's.status',
      eb.fn.countAll<number>().as('count'),
      eb.fn.countAll<number>().filterWhere('s.status_since', '<', stuckBefore).as('stuck_count'),
      eb.fn
        .agg<number | null>('percentile_cont', [sql.lit(0.5)])
        .withinGroupOrderBy(secondsBetween(eb.ref('s.status_since'), eb.val(now)))
        .as('median_age_seconds'),
    ])
    .groupBy('s.status');
};

// --- Helpers ---

type NetworkSummaryRow = Awaited<ReturnType<ReturnType<typeof networkSummariesQuery>['execute']>>[number];

const toNetworkTrackingSummary = (row: NetworkSummaryRow, now: Date) => ({
  closed: row.closed,
  inProgress: row.in_progress,
  lastManagerActionAt: row.last_action_at,
  medianResponseDays: secondsToDays(row.median_response_seconds),
  name: row.nom_reseau,
  networkId: row.id_fcu,
  networkType: row.network_type,
  newestDemandAt: row.newest_demand_at,
  newestPendingDemandAt: row.newest_pending_demand_at,
  notes: row.notes,
  oldestDemandAt: row.oldest_demand_at,
  oldestPendingDemandAt: row.oldest_pending_demand_at,
  pending: row.pending,
  powerMW: row.puissance_totale_MW,
  recentReceived: row.recent_received,
  recentResponded: row.recent_responded,
  reminders: row.reminders,
  sncuId: row['Identifiant reseau'],
  state: getNetworkTrackingState(row, now),
  total: row.total,
  users: row.users,
});

/**
 * Without any demand, nothing to track. Otherwise up to date while no pending demand has waited longer than the late threshold; beyond it, late if a manager acted recently, silent otherwise.
 */
const getNetworkTrackingState = (
  row: Pick<NetworkSummaryRow, 'total' | 'oldest_pending_since' | 'last_action_at'>,
  now: Date
): NetworkTrackingState => {
  const lateBefore = dayjs(now).subtract(businessRules.networkTrackingLateDays.value, 'day');
  const silentBefore = dayjs(now).subtract(businessRules.networkTrackingSilentDays.value, 'day');
  return row.total === 0
    ? 'no_demand'
    : !row.oldest_pending_since || !lateBefore.isAfter(row.oldest_pending_since)
      ? 'up_to_date'
      : row.last_action_at && !silentBefore.isAfter(row.last_action_at)
        ? 'late'
        : 'silent';
};

/**
 * Months of the activity series as `YYYY-MM`, oldest first: the 18 months up to the current one, never before the audit log is usable.
 * Built on calendar months in UTC: month arithmetic on a Paris-time date drifts by an hour across a daylight saving change.
 */
const getActivityMonths = (now: Date) => {
  const currentMonth = dayjs.utc(`${dayjs(now).tz(TIMEZONE).format('YYYY-MM')}-01`);
  const historyStartMonth = DEMAND_HISTORY_START.slice(0, 7);
  return Array.from({ length: ACTIVITY_MONTHS }, (_, index) =>
    currentMonth.subtract(ACTIVITY_MONTHS - 1 - index, 'month').format('YYYY-MM')
  ).filter((month) => month >= historyStartMonth);
};

const secondsToDays = (seconds: number | null) => (seconds === null ? null : Math.round((seconds / SECONDS_PER_DAY) * 10) / 10);
