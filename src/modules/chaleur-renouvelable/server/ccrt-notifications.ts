import { businessRules } from '@/modules/app/business-rules';
import { sendEmailTemplate } from '@/modules/email';
import type { CcrtNewDemandDigestItem } from '@/modules/email/templates/demands/ccrt/nouvelles-demandes-a-traiter-weekly';
import type { CcrtPendingDemandReminder } from '@/modules/email/templates/demands/ccrt/rappel-demandes-en-attente';
import { createEvent } from '@/modules/events/server/service';
import { territoryPermissionToColumn } from '@/modules/permissions/types';
import type { NewDemandsNotificationFrequency } from '@/modules/users/constants';
import { kdb, sql } from '@/server/db/kysely';
import { processInParallel } from '@/utils/async';
import { dayjs } from '@/utils/date';
import { ObjectEntries } from '@/utils/typescript';

import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS, type DemandeChaleurRenouvelable, IS_CCRT_EMAIL_ENABLED } from '../constants';
import { recordCcrtPostHogEvent } from './ccrt-tracking';

/** Day of the week (0 = Sunday) of the weekly digest, matching the cron (Monday). */
const WEEKLY_DIGEST_DAY = 1;

const CCRT_DEMANDES_PATH = '/pro/demandes-chaleur-renouvelable';

const getCcrtDemandesUrl = (demandId?: string) =>
  demandId ? `${CCRT_DEMANDES_PATH}?demandes_chaleur_renouvelable_ccrt_search=${encodeURIComponent(demandId)}` : CCRT_DEMANDES_PATH;

const newDemandsFrequency = sql<NewDemandsNotificationFrequency>`${sql.ref('u.preferences')}->'notifications'->>'new_demands'`;
const pendingDemandsReminder = sql<boolean>`(${sql.ref('u.preferences')}->'notifications'->>'pending_demands_reminder')::boolean`;

/** Paris calendar day of the first notification, null while not notified. */
const notifiedDate = sql<Date | null>`(${sql.ref('d.notified_at')} at time zone 'Europe/Paris')::date`;
const notNotified = sql<boolean>`${sql.ref('d.notified_at')} is null`;

/**
 * Base : jointure (user CCRT actif, permission territoriale, demande d'accompagnement validée).
 * Mêmes mailles que `canUserAccessDemand` pour une demande sans réseau (commune, EPCI, EPT, département, région),
 * mais en SQL. Le rôle est filtré : une collectivité avec une permission territoriale ne reçoit pas ces emails.
 */
const baseNotifiableQuery = () =>
  kdb
    .selectFrom('users as u')
    .innerJoin('user_permissions as up', 'up.user_id', 'u.id')
    .innerJoin('demands_chaleur_renouvelable as d', (join) =>
      join.on((eb) =>
        eb.or(
          ObjectEntries(territoryPermissionToColumn).map(([type, column]) =>
            eb.and([eb('up.type', '=', type), eb('up.resource_id', '=', eb.ref(`d.${column}`))])
          )
        )
      )
    )
    .where('u.active', '=', true)
    .where('u.role', '=', 'ccrt')
    .where('d.validated', '=', true);

const toEmailPayload = (demand: DemandRow): DemandeChaleurRenouvelable => ({
  address: demand.address,
  alternativeHeatingSolutions: demand.alternative_heating_solutions,
  annualHeatingConsumption: demand.annual_heating_consumption,
  averageArea: demand.average_area,
  averageResidents: demand.average_residents,
  batimentConstructionId: demand.batiment_construction_id,
  comments: demand.comments,
  demandConcern: demand.demand_concern,
  dpe: demand.dpe,
  email: demand.email,
  firstName: demand.first_name,
  heatingEnergy: demand.heating_energy,
  hotWaterSystemType: demand.hot_water_system_type,
  housingCount: demand.housing_count,
  housingType: demand.housing_type,
  isPublicAdvisorSelected: demand.is_public_advisor_selected,
  lastName: demand.last_name,
  occupantStatus: demand.occupant_status,
  organizationName: demand.organization_name,
  originDemandId: demand.origin_demand_id,
  outdoorSpace: demand.outdoor_space,
  phone: demand.phone,
  projectStatus: demand.project_status,
  radiatorType: demand.radiator_type,
  refusalPeriod: demand.refusal_period,
  refusalReason: demand.refusal_reason,
  simulationUrl: demand.simulation_url,
  surfaceArea: demand.surface_area,
});

const toDigestItem = (demand: DemandRow): CcrtNewDemandDigestItem => ({
  address: demand.address,
  housingCount: demand.housing_count,
  housingType: demand.housing_type,
  id: demand.id,
  receivedAt: dayjs(demand.created_at).tz('Europe/Paris').format('DD/MM/YYYY'),
  topSolution: demand.alternative_heating_solutions[0] ?? null,
});

const listDemands = (demandIds: string[]) =>
  kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select([
      'address',
      'alternative_heating_solutions',
      'annual_heating_consumption',
      'average_area',
      'average_residents',
      'batiment_construction_id',
      'comments',
      'created_at',
      'demand_concern',
      'departement_code',
      'dpe',
      'email',
      'first_name',
      'heating_energy',
      'hot_water_system_type',
      'housing_count',
      'housing_type',
      'id',
      'is_public_advisor_selected',
      'last_name',
      'occupant_status',
      'organization_name',
      'origin_demand_id',
      'outdoor_space',
      'phone',
      'project_status',
      'radiator_type',
      'refusal_period',
      'refusal_reason',
      'simulation_url',
      'surface_area',
    ])
    .where('id', 'in', demandIds)
    .orderBy('created_at', 'asc')
    .execute();

type DemandRow = Awaited<ReturnType<typeof listDemands>>[number];

/** Validated demands still « À traiter » visible by each recipient, for the counter shown in the emails. */
const countPendingDemandsByRecipient = async (recipientIds: string[]) => {
  const rows = await baseNotifiableQuery()
    .select('u.id')
    .select((eb) => eb.fn.count<number>(sql`distinct ${eb.ref('d.id')}`).as('pending_count'))
    .where('u.id', 'in', recipientIds)
    .where('d.status', '=', DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS)
    .groupBy('u.id')
    .execute();
  return new Map(rows.map((row) => [row.id, Number(row.pending_count)]));
};

/**
 * Envoie un email aux CCRT pour les nouvelles demandes d'accompagnement validées sur leur territoire, selon leur préférence :
 * - quotidien : chaque exécution, un email détaillé par demande pas encore notifiée ;
 * - hebdomadaire : le lundi seulement, un récapitulatif des demandes pas encore notifiées ou notifiées (à un collègue
 *   quotidien) au cours des 7 derniers jours — chaque demande tombe ainsi dans un seul récapitulatif.
 * Marque la demande comme notifiée seulement si au moins un destinataire a été trouvé — sinon on attend
 * qu'une permission territoriale soit ajoutée (idempotent, pas de boucle).
 * Suspendu tant que `IS_CCRT_EMAIL_ENABLED` est faux : rien n'est marqué, le rattrapage se fait à la réactivation.
 */
export const notifyCcrtOfNewDemands = async () => {
  if (!IS_CCRT_EMAIL_ENABLED) {
    return;
  }
  const now = new Date();
  const today = dayjs(now).tz('Europe/Paris');
  const isWeeklyDigestDay = today.day() === WEEKLY_DIGEST_DAY;
  // demands notified strictly after this date were not part of the previous digest
  const previousDigestDate = today.subtract(7, 'day').format('YYYY-MM-DD');

  const recipients = await baseNotifiableQuery()
    .select(['u.id', 'u.email', 'u.structure_name'])
    .select(newDemandsFrequency.as('frequency'))
    .select((eb) => sql<string[]>`array_agg(distinct ${eb.ref('d.id')})`.as('demand_ids'))
    .select((eb) =>
      sql<string[]>`coalesce(array_agg(distinct ${eb.ref('d.id')}) filter (where ${notNotified}), '{}')`.as('unnotified_demand_ids')
    )
    .where((eb) =>
      eb.or([
        eb.and([eb(newDemandsFrequency, '=', 'daily'), eb(notNotified, '=', true)]),
        ...(isWeeklyDigestDay
          ? [
              eb.and([
                eb(newDemandsFrequency, '=', 'weekly'),
                eb.or([eb(notNotified, '=', true), eb(notifiedDate, '>', sql<Date>`${previousDigestDate}::date`)]),
              ]),
            ]
          : []),
      ])
    )
    .groupBy(['u.id', 'u.email', 'u.structure_name', newDemandsFrequency])
    .execute();

  const newlyNotifiedDemandIds = [...new Set(recipients.flatMap((recipient) => recipient.unnotified_demand_ids))];

  if (newlyNotifiedDemandIds.length > 0) {
    await kdb.updateTable('demands_chaleur_renouvelable').set({ notified_at: now }).where('id', 'in', newlyNotifiedDemandIds).execute();
    await Promise.all(
      newlyNotifiedDemandIds.map((demandId) =>
        createEvent({ context_id: demandId, context_type: 'ccrt_demand', type: 'ccrt_demand_notification_sent' })
      )
    );
  }

  if (recipients.length === 0) {
    console.info('0 email(s) envoyé(s) aux CCRT pour les nouvelles demandes.');
    return;
  }

  const allDemandIds = [...new Set(recipients.flatMap((recipient) => recipient.demand_ids))];
  const [demands, pendingCounts] = await Promise.all([
    listDemands(allDemandIds),
    countPendingDemandsByRecipient(recipients.map((recipient) => recipient.id)),
  ]);
  const demandsById = new Map(demands.map((demand) => [demand.id, demand]));

  await processInParallel(recipients, businessRules.emailSendConcurrency.value, async (recipient) => {
    const recipientDemands = demands.filter((demand) => recipient.demand_ids.includes(demand.id));
    const pendingDemandCount = pendingCounts.get(recipient.id) ?? 0;
    const emailRecipient = { email: recipient.email, id: recipient.id };

    if (recipient.frequency === 'weekly') {
      await sendEmailTemplate('demands.ccrt.nouvelles-demandes-a-traiter-weekly', emailRecipient, {
        demandListUrl: CCRT_DEMANDES_PATH,
        demands: recipientDemands.map(toDigestItem),
        pendingDemandCount,
      });
    } else {
      for (const demand of recipientDemands) {
        await sendEmailTemplate('demands.ccrt.nouvelle-demande-chaleur-renouvelable', emailRecipient, {
          demand: toEmailPayload(demand),
          demandUrl: getCcrtDemandesUrl(demand.id),
          pendingDemandCount,
          status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
        });
      }
    }

    await Promise.all(
      recipient.demand_ids.map((demandId) => {
        const demand = demandsById.get(demandId);
        return recordCcrtPostHogEvent({
          distinctId: recipient.id,
          event: 'ccrt_demandes:demande_received',
          properties: {
            demande_id: demandId,
            departement: demand?.departement_code ?? null,
            solution_1: demand?.alternative_heating_solutions[0] ?? null,
            structure_ccrt: recipient.structure_name,
          },
        });
      })
    );
  });

  console.info(`${recipients.length} email(s) envoyé(s) aux CCRT pour les nouvelles demandes.`);
};

/**
 * Relance les CCRT sur les demandes d'accompagnement encore « À traiter » depuis plus de
 * `unhandledDemandReminderDays` après leur réception, sur un territoire pour lequel ils ont une permission.
 *
 * La durée est comptée depuis la réception réelle : le jour du marquage pour un compte notifié
 * quotidiennement, le lundi du récapitulatif suivant le marquage pour un compte hebdomadaire.
 */
export const notifyCcrtOfUnhandledDemands = async () => {
  if (!IS_CCRT_EMAIL_ENABLED) {
    return;
  }
  const now = new Date();
  const today = dayjs(now).tz('Europe/Paris');
  // first Monday on or after the marking date: + ((8 - dow) % 7) days, dow 0 = Sunday, 1 = Monday
  const receivedDate = sql<Date>`case when ${newDemandsFrequency} = 'weekly' then ${notifiedDate} + ((8 - extract(dow from ${notifiedDate})::int) % 7) else ${notifiedDate} end`;

  const rows = await baseNotifiableQuery()
    .select(['u.id', 'u.email', 'd.id as demand_id', 'd.address', 'd.housing_type', 'd.housing_count', 'd.created_at'])
    .distinct()
    .where(pendingDemandsReminder, '=', true)
    .where('d.status', '=', DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS)
    .where(notNotified, '=', false)
    .where(
      receivedDate,
      '<',
      sql<Date>`${now.toISOString()}::timestamptz - ${sql.lit(`${businessRules.unhandledDemandReminderDays.value} days`)}::interval`
    )
    .orderBy('d.created_at', 'asc')
    .execute();

  const recipients = new Map<string, { email: string; demands: CcrtPendingDemandReminder[] }>();
  for (const row of rows) {
    const recipient = recipients.get(row.id) ?? { demands: [], email: row.email };
    recipient.demands.push({
      address: row.address,
      housingCount: row.housing_count,
      housingType: row.housing_type,
      id: row.demand_id,
      waitingDays: Math.max(0, today.diff(dayjs(row.created_at), 'day')),
    });
    recipients.set(row.id, recipient);
  }

  await processInParallel(recipients, businessRules.emailSendConcurrency.value, async ([id, { email, demands }]) => {
    await sendEmailTemplate(
      'demands.ccrt.rappel-demandes-en-attente',
      { email, id },
      {
        demandListUrl: CCRT_DEMANDES_PATH,
        demands: demands.slice(0, businessRules.ccrtReminderListedDemands.value),
        pendingDemandCount: demands.length,
      },
      { subject: `[France Chaleur Urbaine] ${demands.length} demande(s) d'accompagnement en attente de traitement` }
    );
  });

  console.info(`${recipients.size} email(s) envoyé(s) aux CCRT pour les demandes en attente.`);
};
