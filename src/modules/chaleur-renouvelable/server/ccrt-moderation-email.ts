import type { Selectable } from 'kysely';
import type { Logger } from 'winston';

import { sendEmailTemplate } from '@/modules/email';
import { type Jobs, kdb, sql } from '@/server/db/kysely';

import { zCcrtModerationEmailData } from '../constants';
import { getFranceRenovSpaceByCityCode } from './france-renov-spaces';

/**
 * Sends archive/transfer notices after the moderation transaction commits.
 * Delivery reservations prevent duplicate sends and restoration during SMTP delivery.
 */
export const processCcrtModerationEmail = async (job: Pick<Selectable<Jobs>, 'id' | 'data'>, logger: Logger) => {
  const data = zCcrtModerationEmailData.parse(job.data);
  if (data.deliveryStatus === 'sent') {
    return { alreadySent: true };
  }
  const demand = await kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select([
      'id',
      'address',
      'first_name',
      'email',
      'housing_type',
      'housing_count',
      'heating_energy',
      'simulation_url',
      'archived_at',
      'commune_code',
    ])
    .where('id', '=', data.demandId)
    .executeTakeFirst();
  if (!demand?.archived_at || demand.archived_at.toISOString() !== data.archivedAt) {
    return { skipped: true };
  }
  const reservation = await kdb.transaction().execute(async (transaction) => {
    const current = await transaction
      .selectFrom('demands_chaleur_renouvelable')
      .select('archived_at')
      .where('id', '=', data.demandId)
      .forUpdate()
      .executeTakeFirst();
    if (!current?.archived_at || current.archived_at.toISOString() !== data.archivedAt) {
      return null;
    }
    const reserved = await transaction
      .updateTable('jobs')
      .set({ data: { ...data, deliveryStatus: 'sending' } })
      .where('id', '=', job.id)
      .where((expression) => sql<string>`${expression.ref('data')}->>'deliveryStatus'`, 'in', ['ready', 'failed'])
      .returning('id')
      .executeTakeFirst();
    if (!reserved) {
      throw new Error('Envoi déjà réservé : vérifier la livraison avant toute reprise manuelle.');
    }
    return reserved;
  });
  if (!reservation) {
    return { skipped: true };
  }
  const emailDemand = {
    address: demand.address,
    firstName: demand.first_name,
    heatingEnergy: demand.heating_energy,
    housingCount: demand.housing_count,
    housingType: demand.housing_type,
    simulationUrl: demand.simulation_url,
  };
  try {
    if (data.network) {
      await sendEmailTemplate(
        'demands.demandeur.transfert-chaleur-renouvelable',
        { email: demand.email },
        { demand: emailDemand, network: data.network }
      );
    } else {
      const space = await findAdviceSpace(demand.commune_code, logger);
      await sendEmailTemplate('demands.demandeur.archivage-chaleur-renouvelable', { email: demand.email }, { demand: emailDemand, space });
    }
  } catch (error) {
    await kdb
      .updateTable('jobs')
      .set({ data: { ...data, deliveryStatus: 'failed' } })
      .where('id', '=', job.id)
      .execute();
    throw error;
  }
  await kdb
    .updateTable('jobs')
    .set({ data: { ...data, deliveryStatus: 'sent' } })
    .where('id', '=', job.id)
    .execute();
  return { sent: true };
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
