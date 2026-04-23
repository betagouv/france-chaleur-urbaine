import { v4 as uuidv4 } from 'uuid';

import { clientConfig } from '@/client-config';
import type { UpdateUserDemandInput } from '@/modules/demands/constants';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent, createUserEvent } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

import { enrichDemandForAdmin, getDemandById } from './helpers';
import { mergeLegacyValues } from './legacy-values';

const logger = parentLogger.child({ module: 'demands/relances' });

const getAllDemandsToRelance = async () => {
  const records = await kdb
    .selectFrom('demands')
    .selectAll()
    .where((eb) =>
      eb.or([
        eb.and([
          eb(sql`(legacy_values->>'Date de la demande')::date`, '<', sql`NOW() - INTERVAL '1 month'`),
          eb(sql`legacy_values->>'Relance à activer'`, '=', true),
          eb.or([
            eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, '=', ''),
            eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, 'is', null),
          ]),
          eb.or([eb(sql`legacy_values->>'Relance envoyée'`, '=', ''), eb(sql`legacy_values->>'Relance envoyée'`, 'is', null)]),
        ]),
        eb.and([
          eb(sql`(legacy_values->>'Date de la demande')::date`, '<', sql`NOW() - INTERVAL '45 days'`),
          eb.or([
            eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, '=', ''),
            eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, 'is', null),
          ]),
          eb(sql`legacy_values->>'Relance à activer'`, '=', true),
          eb(sql`legacy_values->>'Relance envoyée'`, '!=', ''),
          eb(sql`legacy_values->>'Relance envoyée'`, 'is not', null),
          eb.or([
            eb(sql`legacy_values->>'Seconde relance envoyée'`, '=', ''),
            eb(sql`legacy_values->>'Seconde relance envoyée'`, 'is', null),
          ]),
        ]),
      ])
    )
    .execute();

  return records.map((record) => ({ id: record.id, ...record.legacy_values }));
};

/**
 * Cron job: envoie des relances aux demandeurs s'ils n'ont pas été recontactés
 * par le gestionnaire après 1 mois (1ère relance) puis 15 jours plus tard (2ème).
 */
export const sendRelanceToDemandeurs = async () => {
  const demands = await getAllDemandsToRelance();

  for (const demand of demands) {
    const relanced = demand['Relance envoyée'];
    const relanceId = uuidv4();
    const relanceField = relanced ? 'Seconde relance envoyée' : 'Relance envoyée';

    await kdb
      .updateTable('demands')
      .set({
        legacy_values: mergeLegacyValues({
          'Relance ID': relanceId,
          [relanceField]: new Date().toDateString(),
        }),
        updated_at: new Date(),
      })
      .where('id', '=', demand.id)
      .execute();

    await sendEmailTemplate(
      'demands.user-relance',
      { email: demand.Mail, id: demand.id },
      {
        adresse: demand.Adresse,
        date: new Date(demand['Date de la demande']).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        firstName: demand.Prénom ?? '',
        relanceId,
      }
    );
    await createEvent({
      context_id: demand.id,
      context_type: 'demand',
      data: { isSecondRelance: !!relanced },
      type: 'demand_relance_sent',
    });
  }
};

const findDemandByRelanceId = async (relanceId: string) => {
  const demand = await kdb
    .selectFrom('demands')
    .select(['id', 'legacy_values'])
    .where(sql`legacy_values->>'Relance ID'`, '=', relanceId)
    .executeTakeFirst();

  if (!demand) {
    throw new Error(`Relance demand not found for relance ID: ${relanceId}`);
  }
  return demand;
};

/**
 * User: updates the comment on a demand via the relance link (no auth needed, relanceId acts as token).
 */
export const updateCommentFromRelanceId = async (relanceId: string, comment: string, userId?: string) => {
  const demand = await findDemandByRelanceId(relanceId);

  await kdb
    .updateTable('demands')
    .set({
      legacy_values: mergeLegacyValues({ 'Commentaire relance': comment }),
      updated_at: new Date(),
    })
    .where('id', '=', demand.id)
    .execute();

  if (userId) {
    await createUserEvent({
      author_id: userId,
      context_id: demand.id,
      context_type: 'demand',
      data: { 'Commentaire relance': comment },
      type: 'demand_updated',
    });
  } else {
    await createEvent({
      context_id: demand.id,
      context_type: 'demand',
      data: { 'Commentaire relance': comment },
      type: 'demand_updated',
    });
  }
};

/**
 * User: updates the satisfaction flag on a demand via the relance link.
 * Triggers a notification email when the demand is for a Bailleur social or Tertiaire structure.
 */
export const updateSatisfactionFromRelanceId = async (relanceId: string, satisfaction: boolean) => {
  const relanceDemand = await findDemandByRelanceId(relanceId);
  const satisfactionValue = satisfaction ? 'Oui' : 'Non';

  const [updatedDemand] = await kdb
    .updateTable('demands')
    .set({
      legacy_values: mergeLegacyValues({ 'Recontacté par le gestionnaire': satisfactionValue }),
      updated_at: new Date(),
    })
    .where('id', '=', relanceDemand.id)
    .returningAll()
    .execute();

  await createEvent({
    context_id: relanceDemand.id,
    context_type: 'demand',
    data: { 'Recontacté par le gestionnaire': satisfactionValue },
    type: 'demand_updated',
  });

  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .selectAll()
    .where('demand_id', '=', updatedDemand.id)
    .executeTakeFirst();

  const enriched = enrichDemandForAdmin({ demand: updatedDemand, testAddress: testAddress || null });

  // Automation import from https://airtable.com/app9opX8gRAtBqkan/wfl3jPABYXeIrGeUr/wtrWn0m6O5tXFFdiP
  if (enriched.Structure === 'Bailleur social' || enriched.Structure === 'Tertiaire') {
    await sendEmailTemplate(
      'demands.admin-gestionnaire-contact',
      { email: clientConfig.destinationEmails.pro },
      { demand: enriched }
    ).catch((error: unknown) => {
      logger.error('Failed to send gestionnaire contact email:', error);
    });
  }
  return enriched;
};

/**
 * User: updates a demand from fields in `zUserDemandUpdateValues` (Commentaire relance, Sondage).
 * Only merges into legacy_values.
 */
export const updateDemandByUser = async (demandId: string, values: UpdateUserDemandInput, userId?: string) => {
  const [updatedDemand] = await kdb
    .updateTable('demands')
    .set({
      legacy_values: mergeLegacyValues(values),
      updated_at: new Date(),
    })
    .where('id', '=', demandId)
    .returningAll()
    .execute();

  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .selectAll()
    .where('demand_id', '=', updatedDemand.id)
    .executeTakeFirst();

  if (userId) {
    await createUserEvent({
      author_id: userId,
      context_id: demandId,
      context_type: 'demand',
      data: values,
      type: 'demand_updated',
    });
  } else {
    await createEvent({
      context_id: demandId,
      context_type: 'demand',
      data: values,
      type: 'demand_updated',
    });
  }

  const demand = await getDemandById(updatedDemand.id);
  if (!demand) {
    throw new Error('Demand not found');
  }
  return enrichDemandForAdmin({ demand, testAddress: testAddress || null });
};
