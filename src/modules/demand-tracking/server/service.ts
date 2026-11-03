import {
  DEMANDE_CHALEUR_RENOUVELABLE_NOT_VALIDATED_STATUS_DISPLAY,
  demandeChaleurRenouvelableStatusDisplays,
} from '@/modules/chaleur-renouvelable/constants';
import { DEMAND_NOT_VALIDATED_STATUS_DISPLAY, demandStatusDisplays } from '@/modules/demands/constants';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { createLogger } from '@/server/helpers/logger';
import type { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { emailFingerprint } from '@/utils/email-fingerprint';

import type { DemandTrackingEmailRow } from '../constants';

const logger = createLogger('demand-tracking');

type TrackedDemand = DemandTrackingEmailRow & {
  createdAt: Date;
  firstName: string | null;
};

/**
 * Sends the "Où en est votre demande ?" recap to the given address when at least one demand matches it.
 * Silent otherwise, so the caller can show the same message whether or not a demand exists.
 */
export async function requestDemandTracking(email: string): Promise<void> {
  const demands = await findDemandsByEmail(email);

  if (demands.length === 0) {
    logger.info('demand tracking requested without matching demand', { email_fingerprint: emailFingerprint(email) });
    await recordRequest('no_match', demands);
    return;
  }

  const rows = sortDemandsForEmail(demands);
  await sendEmailTemplate(
    'demands.demandeur.suivi-demande',
    { email },
    {
      demands: rows.map(({ createdAt: _createdAt, firstName: _firstName, ...row }) => row),
      firstName: rows[0].firstName,
    }
  );
  logger.info('demand tracking email sent', { demands_count: demands.length, email_fingerprint: emailFingerprint(email) });
  await recordRequest('sent', demands);
}

/** Audit event counting every request, so the share of requests ending in an email can be computed. Nothing personal. */
const recordRequest = (outcome: 'sent' | 'no_match', demands: TrackedDemand[]) =>
  createEvent({
    context_id: null,
    context_type: null,
    data: {
      demand_types: [...new Set(demands.map((demand) => demand.type))],
      demands_count: demands.length,
      outcome,
    },
    type: 'demand_tracking_requested',
  });

/** Open demands first, then closed ones; most recent first within each group. */
export const sortDemandsForEmail = <Demand extends Pick<TrackedDemand, 'createdAt' | 'status'>>(demands: Demand[]): Demand[] =>
  [...demands].sort((first, second) => {
    if (first.status.phase !== second.status.phase) {
      return first.status.phase === 'en_cours' ? -1 : 1;
    }
    return second.createdAt.getTime() - first.createdAt.getTime();
  });

const findDemandsByEmail = async (email: string): Promise<TrackedDemand[]> => {
  const [raccordementDemands, accompagnementDemands] = await Promise.all([
    kdb
      .selectFrom('demands')
      .select((eb) => [
        'created_at',
        'validated',
        sql<string>`${eb.ref('legacy_values')}->>'Adresse'`.as('address'),
        sql<string | null>`${eb.ref('legacy_values')}->>'Prénom'`.as('first_name'),
        sql<DEMANDE_STATUS>`${eb.ref('legacy_values')}->>'Status'`.as('status'),
      ])
      .where((eb) => eb(sql`lower(${eb.ref('legacy_values')}->>'Mail')`, '=', email))
      .where('deleted_at', 'is', null)
      .execute(),
    kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(['address', 'created_at', 'first_name', 'status', 'validated'])
      .where((eb) => eb(eb.fn('lower', ['email']), '=', email))
      .execute(),
  ]);

  return [
    ...raccordementDemands.map(
      (demand): TrackedDemand => ({
        address: demand.address,
        createdAt: demand.created_at,
        firstName: demand.first_name,
        status: demand.validated ? demandStatusDisplays[demand.status] : DEMAND_NOT_VALIDATED_STATUS_DISPLAY,
        type: 'raccordement',
      })
    ),
    ...accompagnementDemands.map(
      (demand): TrackedDemand => ({
        address: demand.address,
        createdAt: demand.created_at,
        firstName: demand.first_name,
        status: demand.validated
          ? demandeChaleurRenouvelableStatusDisplays[demand.status]
          : DEMANDE_CHALEUR_RENOUVELABLE_NOT_VALIDATED_STATUS_DISPLAY,
        type: 'accompagnement',
      })
    ),
  ];
};
