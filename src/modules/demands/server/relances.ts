import { v4 as uuidv4 } from 'uuid';

import type { SubmitSurveyInput } from '@/modules/demands/constants';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';

import { enrichDemandForAdmin, getDemandById } from './helpers';
import { mergeLegacyValues } from './legacy-values';

const getAllDemandsToRelance = async () => {
  const records = await kdb
    .selectFrom('demands')
    .selectAll()
    .where('validated', '=', true)
    .where('deleted_at', 'is', null)
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
      'demands.demandeur.enquete-satisfaction',
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
  return await kdb
    .selectFrom('demands')
    .select(['id', 'legacy_values'])
    .where(sql`legacy_values->>'Relance ID'`, '=', relanceId)
    .executeTakeFirstOrThrow(() => new Error(`Relance demand not found for relance ID: ${relanceId}`));
};

/**
 * User: updates the comment on a demand via the relance link (no auth needed, relanceId acts as token).
 * Émis dans le flow satisfaction (page /satisfaction) après que l'user a répondu Oui/Non.
 */
export const updateCommentFromRelanceId = async (relanceId: string, comment: string) => {
  const demand = await findDemandByRelanceId(relanceId);

  await kdb
    .updateTable('demands')
    .set({
      legacy_values: mergeLegacyValues({ 'Commentaire relance': comment }),
      updated_at: new Date(),
    })
    .where('id', '=', demand.id)
    .execute();

  await createEvent({
    context_id: demand.id,
    context_type: 'demand',
    data: { comment },
    type: 'demand_satisfaction_comment_submitted',
  });
};

/**
 * User: updates the satisfaction flag on a demand via the relance link.
 * Triggers a notification email when the demand is for a Bailleur social or Tertiaire structure.
 */
export const updateSatisfactionFromRelanceId = async (relanceId: string, satisfaction: boolean) => {
  const relanceDemand = await findDemandByRelanceId(relanceId);
  const satisfactionValue = satisfaction ? 'Oui' : 'Non';

  await kdb
    .updateTable('demands')
    .set({
      legacy_values: mergeLegacyValues({ 'Recontacté par le gestionnaire': satisfactionValue }),
      updated_at: new Date(),
    })
    .where('id', '=', relanceDemand.id)
    .execute();

  await createEvent({
    context_id: relanceDemand.id,
    context_type: 'demand',
    data: { recontacted: satisfaction },
    type: 'demand_satisfaction_submitted',
  });

  const demand = await getDemandById(relanceDemand.id);
  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .selectAll()
    .where('demand_id', '=', demand.id)
    .executeTakeFirst();

  const enriched = enrichDemandForAdmin({ demand, testAddress: testAddress || null });

  return enriched;
};

/**
 * User: répond au sondage post-soumission de demande ("Comment avez-vous connu FCU ?").
 * Pas d'auth nécessaire — appelé depuis DemandSondageForm sur la page de confirmation.
 */
export const submitSurvey = async (demandId: string, values: SubmitSurveyInput) => {
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

  if (values.Sondage) {
    await createEvent({
      context_id: demandId,
      context_type: 'demand',
      data: { sondage: values.Sondage },
      type: 'demand_survey_submitted',
    });
  }

  const demand = await getDemandById(updatedDemand.id);
  return enrichDemandForAdmin({ demand, testAddress: testAddress || null });
};
