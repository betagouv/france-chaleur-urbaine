import type { Selectable } from 'kysely';
import type { Logger } from 'winston';
import { z } from 'zod';

import type { BANAddressFeature } from '@/modules/ban/types';
import { sendEmailTemplate } from '@/modules/email';
import { serverConfig } from '@/server/config';
import { type Jobs, kdb, sql } from '@/server/db/kysely';
import { fetchJSON } from '@/utils/network';

import { getNearestFranceRenovSpace } from './france-renov-directory';

const zDeliveryData = z.object({
  archivedAt: z.iso.datetime(),
  deliveryStatus: z.enum(['ready', 'sending', 'sent', 'failed']),
  demandId: z.uuid(),
  network: z.object({ distance: z.number().nullable(), manager: z.string().nullable(), name: z.string() }).nullable(),
});

/**
 * Delivers moderation emails after commit, retaining a reservation when SMTP success cannot be reconciled.
 */
export const processCcrtModerationEmail = async (job: Pick<Selectable<Jobs>, 'id'>, logger: Logger) => {
  const storedJob = await kdb.selectFrom('jobs').select('data').where('id', '=', job.id).executeTakeFirstOrThrow();
  const data = zDeliveryData.parse(storedJob.data);
  if (data.deliveryStatus === 'sent') {
    return { alreadySent: true };
  }
  const demand = await kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select(['id', 'address', 'first_name', 'email', 'housing_type', 'housing_count', 'heating_energy', 'simulation_url', 'archived_at'])
    .where('id', '=', data.demandId)
    .executeTakeFirst();
  if (!demand?.archived_at || demand.archived_at.toISOString() !== data.archivedAt) {
    return { skipped: true };
  }
  const reservation = await kdb
    .updateTable('jobs')
    .set({ data: { ...data, deliveryStatus: 'sending' } })
    .where('id', '=', job.id)
    .where((expression) => sql<string>`${expression.ref('data')}->>'deliveryStatus'`, 'in', ['ready', 'failed'])
    .returning('id')
    .executeTakeFirst();
  if (!reservation) {
    throw new Error('Envoi déjà réservé : vérifier la livraison avant toute reprise manuelle.');
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
      const space = await findAdviceSpace(demand.address, logger);
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

const findAdviceSpace = async (address: string, logger: Logger) => {
  try {
    const result = await fetchJSON<{ features: BANAddressFeature[] }>(`${serverConfig.banApiBaseUrl}search`, {
      params: { limit: 1, q: address },
      signal: AbortSignal.timeout(10000),
    });
    const coordinates = result.features[0]?.geometry.coordinates;
    return coordinates ? await getNearestFranceRenovSpace({ lat: coordinates[1], lon: coordinates[0] }) : null;
  } catch {
    logger.warn('Advice centre geocoding unavailable');
    return null;
  }
};
