import { TRPCError } from '@trpc/server';
import type { Logger } from 'winston';

import { sendEmailTemplate } from '@/modules/email';
import { kdb } from '@/server/db/kysely';

import { getFranceRenovSpaceByCityCode } from './france-renov-spaces';

/**
 * Sends archive/transfer notices directly after the moderation transaction commits.
 */
export const sendCcrtModerationEmail = async (
  demandId: string,
  logger: Logger,
  network?: { name: string; distance: number | null; manager: string | null }
) => {
  const demand = await kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select(['address', 'first_name', 'email', 'housing_type', 'housing_count', 'heating_energy', 'simulation_url', 'commune_code'])
    .where('id', '=', demandId)
    .executeTakeFirstOrThrow();
  const emailDemand = {
    address: demand.address,
    firstName: demand.first_name,
    heatingEnergy: demand.heating_energy,
    housingCount: demand.housing_count,
    housingType: demand.housing_type,
    simulationUrl: demand.simulation_url,
  };
  try {
    if (network) {
      await sendEmailTemplate(
        'demands.demandeur.transfert-chaleur-renouvelable',
        { email: demand.email },
        { demand: emailDemand, network }
      );
    } else {
      const space = await findAdviceSpace(demand.commune_code, logger);
      await sendEmailTemplate('demands.demandeur.archivage-chaleur-renouvelable', { email: demand.email }, { demand: emailDemand, space });
    }
  } catch {
    logger.error('CCRT moderation email delivery failed', { demandId });
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'La modération a été enregistrée, mais l’envoi de l’email a échoué.',
    });
  }
};

const findAdviceSpace = async (cityCode: string | null, logger: Logger) => {
  if (!cityCode) {
    return null;
  }
  try {
    return await getFranceRenovSpaceByCityCode(cityCode);
  } catch {
    logger.warn('France Renov spaces unavailable');
    return null;
  }
};
