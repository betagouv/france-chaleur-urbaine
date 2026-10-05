import { kdb } from '@/server/db/kysely';

import type { AdminDashboardIndicators } from '../constants';

const JOBS_IN_ERROR_WINDOW_DAYS = 7;

/** Counts of the items waiting for the FCU team, displayed on the admin dashboard. */
export const getAdminDashboardIndicators = async (): Promise<AdminDashboardIndicators> => {
  const jobsErrorCutoff = new Date(Date.now() - JOBS_IN_ERROR_WINDOW_DAYS * 24 * 3600 * 1000);
  const [demands, renewableHeatDemands, networkChangeRequests, jobs] = await Promise.all([
    kdb
      .selectFrom('demands')
      .select((eb) => [
        eb.fn.count<number>(eb.case().when('validated', '=', false).then(1).end()).as('to_validate'),
        eb.fn.count<number>(eb.case().when('pending_assignment_change', 'is not', null).then(1).end()).as('pending_reassignments'),
      ])
      .where('deleted_at', 'is', null)
      .executeTakeFirstOrThrow(),
    kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('validated', '=', false)
      .executeTakeFirstOrThrow(),
    kdb
      .selectFrom('network_change_requests')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('status', '=', 'pending')
      .executeTakeFirstOrThrow(),
    kdb
      .selectFrom('jobs')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('status', '=', 'error')
      .where('updated_at', '>', jobsErrorCutoff)
      .executeTakeFirstOrThrow(),
  ]);

  return {
    demandsToValidate: Number(demands.to_validate),
    jobsInError: Number(jobs.count),
    networkChangeRequestsPending: Number(networkChangeRequests.count),
    pendingReassignments: Number(demands.pending_reassignments),
    renewableHeatDemandsToValidate: Number(renewableHeatDemands.count),
  };
};
