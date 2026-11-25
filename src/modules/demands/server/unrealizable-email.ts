import type { Selectable } from 'kysely';

import { fcrLegacyValueKeys, UNREALIZABLE_REASON_INVALID_DEMAND, type UnrealizableReason } from '@/modules/demands/constants';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import type { Demands } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

type MaybeUnrealizableStatusChange = {
  currentDemand: Pick<Selectable<Demands>, 'id' | 'legacy_values'>;
  nextStatus?: string;
  reason?: UnrealizableReason | null;
};

/**
 * Sends the demandeur email when an existing demand is manually closed as unrealizable, whoever closes it.
 * An invalid demand (test, duplicate) is closed silently.
 */
export const sendUnrealizableDemandEmailIfNeeded = async ({ currentDemand, nextStatus, reason }: MaybeUnrealizableStatusChange) => {
  if (
    nextStatus !== DEMANDE_STATUS.UNREALISABLE ||
    currentDemand.legacy_values.Status === DEMANDE_STATUS.UNREALISABLE ||
    reason === UNREALIZABLE_REASON_INVALID_DEMAND
  ) {
    return;
  }

  const alternativeHeatingSolutions = currentDemand.legacy_values[fcrLegacyValueKeys.alternativeHeatingSolutions] ?? [];
  const simulationUrl = currentDemand.legacy_values[fcrLegacyValueKeys.simulationUrl];

  await sendEmailTemplate(
    'demands.demandeur.raccordement-non-realisable',
    { email: currentDemand.legacy_values.Mail, id: currentDemand.id },
    {
      address: currentDemand.legacy_values.Adresse,
      ...(alternativeHeatingSolutions.length > 0 && { alternativeHeatingSolutions }),
      originDemandId: currentDemand.id,
      ...(simulationUrl && { simulationUrl }),
    }
  );

  await createEvent({
    context_id: currentDemand.id,
    context_type: 'demand',
    data: {},
    type: 'demand_unrealizable_email_sent',
  });
};
