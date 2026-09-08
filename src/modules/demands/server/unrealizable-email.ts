import type { Selectable } from 'kysely';

import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import type { Demands } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

type MaybeUnrealizableStatusChange = {
  currentDemand: Pick<Selectable<Demands>, 'id' | 'legacy_values'>;
  nextStatus?: string;
};

/**
 * Sends the demandeur email when an existing demand is manually closed as unrealizable.
 */
export const sendUnrealizableDemandEmailIfNeeded = async ({ currentDemand, nextStatus }: MaybeUnrealizableStatusChange) => {
  if (nextStatus !== DEMANDE_STATUS.UNREALISABLE || currentDemand.legacy_values.Status === DEMANDE_STATUS.UNREALISABLE) {
    return;
  }

  await sendEmailTemplate(
    'demands.demandeur.raccordement-non-realisable',
    { email: currentDemand.legacy_values.Mail, id: currentDemand.id },
    {
      address: currentDemand.legacy_values.Adresse,
    }
  );

  await createEvent({
    context_id: currentDemand.id,
    context_type: 'demand',
    data: null,
    type: 'demand_unrealizable_email_sent',
  });
};
