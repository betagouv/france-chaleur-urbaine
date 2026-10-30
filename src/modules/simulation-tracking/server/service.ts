import { businessRules } from '@/modules/app/business-rules';
import type { TrackingRequestContext } from '@/modules/conversion-tracking/server/request-context';
import { mostSpecificRuleExcludes } from '@/modules/conversion-tracking/server/service';
import { kdb, sql } from '@/server/db/kysely';

import type {
  CreateSimulationInput,
  GetSimulationFunnelInput,
  RecordSimulationOutcomeInput,
  SimulationOutcome,
  SimulationSnapshot,
  UpdateSimulationInput,
} from '../constants';

/**
 * First-party tracking of the renewable heating simulations: one mutable row per address tested on the results page, written
 * only by the public client routes (best effort, never blocking the journey). See `AGENTS.md`.
 */

const snapshotColumns = (snapshot: SimulationSnapshot) => ({
  address: snapshot.address,
  address_resolved: snapshot.addressResolved,
  batiment_construction_id: snapshot.batimentConstructionId,
  ccrt_demand_available: snapshot.ccrtDemandAvailable,
  commune_code: snapshot.communeCode,
  departement_code: snapshot.departementCode,
  heat_network_available: snapshot.heatNetworkAvailable,
  housing_type: snapshot.housingType,
  outdoor_space: snapshot.outdoorSpace,
  radiator_type: snapshot.radiatorType,
  recommended_solution: snapshot.recommendedSolution,
  refusal_already_known: snapshot.refusalAlreadyKnown,
});

/** Rows older than the update window are frozen: a shared or replayed id can no longer rewrite them. */
const withinUpdateWindow = sql<Date>`now() - ${sql.lit(`${businessRules.fcrSimulationUpdateWindowHours.value} hours`)}::interval`;

/**
 * Creates a simulation. The client-generated id makes the call idempotent (a replay or a forged duplicate is ignored);
 * an IP already banned by a rule enters directly excluded from the statistics.
 */
export async function createSimulation(input: CreateSimulationInput, request: Pick<TrackingRequestContext, 'ip' | 'userAgent'>) {
  await kdb
    .insertInto('simulations_chaleur_renouvelable')
    .values({
      ...snapshotColumns(input),
      excluded: request.ip ? mostSpecificRuleExcludes(sql<string>`${request.ip}::inet`) : false,
      host: input.host,
      id: input.id,
      ip: request.ip,
      page: input.page,
      previous_simulation_id: input.previousSimulationId,
      route: input.route,
      source: input.source,
      user_agent: request.userAgent,
    })
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();
}

/**
 * Replaces the current state of a simulation after the user edited its parameters. Silently ignored outside the
 * update window or past the revisions cap (anti-abuse bounds of a public write endpoint).
 */
export async function updateSimulation(input: UpdateSimulationInput) {
  await kdb
    .updateTable('simulations_chaleur_renouvelable')
    .set((eb) => ({
      ...snapshotColumns(input),
      revisions: eb('revisions', '+', 1),
      updated_at: new Date(),
    }))
    .where('id', '=', input.id)
    .where('created_at', '>=', withinUpdateWindow)
    .where('revisions', '<', businessRules.fcrSimulationMaxRevisions.value)
    .execute();
}

/** Records the outcome of a simulation (with the created demand id); the first recorded outcome wins, later calls are ignored. */
export async function recordSimulationOutcome(input: RecordSimulationOutcomeInput) {
  await kdb
    .updateTable('simulations_chaleur_renouvelable')
    .set({
      demand_id: input.outcome === 'france_renov_orientation' ? null : input.demandId,
      outcome: input.outcome,
      outcome_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', input.id)
    .where('outcome', 'is', null)
    .where('created_at', '>=', withinUpdateWindow)
    .execute();
}

export type SimulationFunnelRow = {
  /** Next route pattern of the start page (`/`, `/chaleur-renouvelable`, the results page on a direct arrival). */
  route: string;
  /** Iframe integration id when the simulation was started from an integration. */
  source: string | null;
  /** The address matched a BAN house number (otherwise no building, no eligibility, no territory). */
  addressResolved: boolean;
  refusalAlreadyKnown: boolean;
  heatNetworkAvailable: boolean;
  ccrtDemandAvailable: boolean;
  outcome: SimulationOutcome | null;
  /** At least one heating solution fitted (otherwise the results page showed the « no solution » section). */
  hasSolution: boolean;
  simulations: number;
  /** Simulations whose parameters were edited at least once after the arrival. */
  revised: number;
};

/**
 * Simulations of a period grouped by start page, contact options offered and outcome: the client turns these rows into
 * the entry → situation → outcome flow and its indicators. Excluded rows (banned IPs) are never counted.
 */
export async function getSimulationFunnel(params: GetSimulationFunnelInput): Promise<SimulationFunnelRow[]> {
  const rows = await kdb
    .selectFrom('simulations_chaleur_renouvelable')
    .select((eb) => [
      'route',
      'source',
      'address_resolved',
      'refusal_already_known',
      'heat_network_available',
      'ccrt_demand_available',
      'outcome',
      eb('recommended_solution', 'is not', null).as('has_solution'),
      eb.fn.countAll<number>().as('simulations'),
      eb.fn.countAll<number>().filterWhere('revisions', '>', 0).as('revised'),
    ])
    .where('created_at', '>=', params.dateFrom)
    .where('created_at', '<=', params.dateTo)
    .where('excluded', '=', false)
    .$if(params.housingType !== undefined, (qb) => qb.where('housing_type', '=', params.housingType!))
    .$if(params.radiatorType !== undefined, (qb) => qb.where('radiator_type', '=', params.radiatorType!))
    .$if(params.outdoorSpace !== undefined, (qb) => qb.where('outdoor_space', '=', params.outdoorSpace!))
    .$if(params.departementCode !== undefined, (qb) => qb.where('departement_code', '=', params.departementCode!))
    .groupBy((eb) => [
      'route',
      'source',
      'address_resolved',
      'refusal_already_known',
      'heat_network_available',
      'ccrt_demand_available',
      'outcome',
      eb('recommended_solution', 'is not', null),
    ])
    .execute();

  return rows.map((row) => ({
    addressResolved: row.address_resolved,
    ccrtDemandAvailable: row.ccrt_demand_available,
    hasSolution: Boolean(row.has_solution),
    heatNetworkAvailable: row.heat_network_available,
    outcome: row.outcome,
    refusalAlreadyKnown: row.refusal_already_known,
    revised: row.revised,
    route: row.route,
    simulations: row.simulations,
    source: row.source,
  }));
}
