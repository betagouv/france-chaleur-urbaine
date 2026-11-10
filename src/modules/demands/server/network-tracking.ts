import { TRPCError } from '@trpc/server';
import type { Expression, ExpressionBuilder, SqlBool } from 'kysely';

import { businessRules } from '@/modules/app/business-rules';
import type { NetworkType } from '@/modules/reseaux/constants';
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
 * Admin: tracking indicators of every network that has at least one validated demand.
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
  const activityStart = getActivityStart(now);

  const [summaryRow, receivedByMonth, handledByMonth, quarters, statuses] = await Promise.all([
    networkSummariesQuery(now, network).executeTakeFirstOrThrow(
      () => new TRPCError({ code: 'NOT_FOUND', message: 'Aucune demande validée pour ce réseau' })
    ),
    receivedByMonthQuery(network, activityStart).execute(),
    handledByMonthQuery(network, activityStart).execute(),
    quartersQuery(network, activityStart).execute(),
    statusesQuery(network, now).execute(),
  ]);

  const monthCount = dayjs(now).tz(TIMEZONE).startOf('month').diff(dayjs(activityStart).tz(TIMEZONE), 'month') + 1;

  return {
    months: Array.from({ length: monthCount }, (_, index) => {
      const month = dayjs(activityStart).tz(TIMEZONE).add(index, 'month').format('YYYY-MM');
      return {
        handled: handledByMonth.find((row) => row.month === month)?.count ?? 0,
        month,
        received: receivedByMonth.find((row) => row.month === month)?.count ?? 0,
      };
    }),
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

const networksQuery = () =>
  kdb
    .selectFrom('reseaux_de_chaleur')
    .select(['id_fcu', 'nom_reseau', 'Identifiant reseau', 'Gestionnaire as gestionnaire'])
    .select(sql.lit<NetworkType>('reseau_de_chaleur').as('network_type'))
    .unionAll(
      kdb
        .selectFrom('zones_et_reseaux_en_construction')
        .select(['id_fcu', 'nom_reseau', 'Identifiant reseau', 'gestionnaire'])
        .select(sql.lit<NetworkType>('reseau_en_construction').as('network_type'))
    );

const secondsBetween = (start: Expression<Date | null>, end: Expression<Date | null>) => sql<number>`extract(epoch from ${end} - ${start})`;

const networkSummariesQuery = (now: Date, network?: NetworkRef) => {
  const responseWindowStart = dayjs(now).subtract(businessRules.networkTrackingResponseWindowMonths.value, 'month').toDate();
  return kdb
    .with('timeline', () => demandTimelineQuery(network))
    .with('networks', networksQuery)
    .selectFrom('timeline as t')
    .leftJoin('networks as n', (join) => join.onRef('n.id_fcu', '=', 't.network_id').onRef('n.network_type', '=', 't.network_type'))
    .groupBy(['t.network_type', 't.network_id', 'n.nom_reseau', 'n.Identifiant reseau', 'n.gestionnaire'])
    .select((eb) => [
      't.network_type',
      't.network_id',
      'n.nom_reseau',
      'n.Identifiant reseau',
      'n.gestionnaire',
      eb.fn.countAll<number>().as('total'),
      eb.fn.countAll<number>().filterWhere('t.status', 'in', demandStatusGroups.pending).as('pending'),
      eb.fn.countAll<number>().filterWhere('t.status', 'in', demandStatusGroups.inProgress).as('in_progress'),
      eb.fn.countAll<number>().filterWhere('t.status', 'in', demandStatusGroups.closed).as('closed'),
      eb.fn.min('t.waiting_since').filterWhere('t.status', 'in', demandStatusGroups.pending).as('oldest_pending_since'),
      eb.fn.max('t.last_action_at').as('last_action_at'),
      eb.fn.countAll<number>().filterWhere('t.started_at', '>=', responseWindowStart).as('recent_received'),
      eb.fn.count<number>('t.responded_at').filterWhere('t.started_at', '>=', responseWindowStart).as('recent_responded'),
      eb.fn
        .agg<number | null>('percentile_cont', [sql.lit(0.5)])
        .withinGroupOrderBy(secondsBetween(eb.ref('t.started_at'), eb.ref('t.responded_at')))
        .filterWhere('t.started_at', '>=', responseWindowStart)
        .as('median_response_seconds'),
    ])
    .orderBy('t.network_type')
    .orderBy('t.network_id');
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
      eb.fn.countAll<number>().as('received'),
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
  gestionnaire: row.gestionnaire,
  inProgress: row.in_progress,
  lastManagerActionAt: row.last_action_at,
  medianResponseDays: secondsToDays(row.median_response_seconds),
  name: row.nom_reseau,
  networkId: row.network_id,
  networkType: row.network_type,
  oldestPendingSince: row.oldest_pending_since,
  pending: row.pending,
  recentReceived: row.recent_received,
  recentResponded: row.recent_responded,
  sncuId: row['Identifiant reseau'],
  state: getNetworkTrackingState(row, now),
  total: row.total,
});

/**
 * Up to date while no pending demand is older than the late threshold; beyond it, late if a manager acted recently, silent otherwise.
 */
const getNetworkTrackingState = (
  row: Pick<NetworkSummaryRow, 'oldest_pending_since' | 'last_action_at'>,
  now: Date
): NetworkTrackingState => {
  const lateBefore = dayjs(now).subtract(businessRules.networkTrackingLateDays.value, 'day');
  const silentBefore = dayjs(now).subtract(businessRules.networkTrackingSilentDays.value, 'day');
  return !row.oldest_pending_since || !lateBefore.isAfter(row.oldest_pending_since)
    ? 'up_to_date'
    : row.last_action_at && !silentBefore.isAfter(row.last_action_at)
      ? 'late'
      : 'silent';
};

/** First month of the activity series: 18 months back, never before the audit log is usable. */
const getActivityStart = (now: Date) => {
  const historyStart = dayjs.tz(DEMAND_HISTORY_START, TIMEZONE);
  const windowStart = dayjs(now)
    .tz(TIMEZONE)
    .startOf('month')
    .subtract(ACTIVITY_MONTHS - 1, 'month');
  return (windowStart.isAfter(historyStart) ? windowStart : historyStart).toDate();
};

const secondsToDays = (seconds: number | null) => (seconds === null ? null : Math.round((seconds / SECONDS_PER_DAY) * 10) / 10);
