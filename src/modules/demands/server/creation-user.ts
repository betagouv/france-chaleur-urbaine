import { businessRules } from '@/modules/app/business-rules';
import { type CreateDemandInput, type DemandSubmissionResult, formatDataToLegacyAirtable } from '@/modules/demands/constants';
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import { createEligibilityTestAddress } from '@/modules/pro-eligibility-tests/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { omitEmptyStringValues } from '@/utils/objects';

import {
  autoAssignNetworkFromEligibility,
  fillDemandTerritoryFromCoords,
  getBatimentInfoAtCoords,
  getConsommationGazAdresse,
} from './eligibility';
import { getDemandById } from './helpers';
import type { LegacyValuesPatch } from './legacy-values';

/** Fenêtre de dédoublonnage : une demande identique (email + adresse) dans cette fenêtre bloque une nouvelle création. */
const DEMAND_DEDUP_WINDOW_DAYS = businessRules.demandDedupWindowDays.value;

/**
 * Crée une demande côté utilisateur : enrichit avec la conso gaz / bâtiment BNB,
 * auto-assigne un réseau d'après l'éligibilité, et déclenche les emails user + admin.
 */
export const createDemand = async (
  values: CreateDemandInput,
  {
    userId,
    pro_eligibility_tests_addresse_id,
    deduplicate,
  }: { userId?: string; pro_eligibility_tests_addresse_id?: string; deduplicate?: boolean } = {}
): Promise<DemandSubmissionResult> => {
  // Normalisation avant toute comparaison (dédup) ou insertion : email + adresse sans espaces superflus,
  // pour tous les appelants (route user comme batch pro). Les données historiques sont nettoyées par migration.
  values = { ...values, address: values.address.trim(), email: values.email.trim() };

  if (deduplicate) {
    const existingDemand = await findRecentDemandByEmailAndAddress(values.email, values.address);
    if (existingDemand) {
      return toDemandSubmissionResult(existingDemand, true);
    }
  }

  const { lat, lon } = values.coords;
  const legacyValues = formatDataToLegacyAirtable(values);

  const [conso, nbLogement] = await Promise.all([
    getConsommationGazAdresse(lat, lon),
    values.nbLogements ? { batiment_groupe_id: undefined, nb_logements: values.nbLogements } : getBatimentInfoAtCoords(lat, lon),
  ]);

  // Les chaînes vides ne sont pas stockées : clé absente = null côté API/UI
  const legacyRecord = omitEmptyStringValues({
    ...legacyValues,
    Conso: conso ? conso.conso_nb : undefined,
    'Date de la demande': new Date().toISOString(),
    'ID BNB': nbLogement?.batiment_groupe_id ? `${nbLogement.batiment_groupe_id}` : undefined,
    'ID réseau le plus proche': null,
    Logement: nbLogement?.nb_logements ? nbLogement.nb_logements : undefined,
    'Relance à activer': values.eligibility.isEligible && values.heatingType === 'collectif',
    Status: values.eligibility.isEligible ? DEMANDE_STATUS.TO_PROCESS : DEMANDE_STATUS.UNREALISABLE,
  } satisfies LegacyValuesPatch);

  const [createdDemand] = await kdb
    .insertInto('demands')
    .values({
      created_at: new Date(),
      legacy_values: sql<string>`${JSON.stringify(legacyRecord)}::jsonb`,
      origin_host: values.origin_host ?? null,
      origin_page: values.origin_page ?? null,
      origin_source: values.origin_source ?? null,
      updated_at: new Date(),
      user_id: userId ?? null,
    })
    .returningAll()
    .execute();

  if (lat && lon) {
    await fillDemandTerritoryFromCoords(createdDemand.id, lon, lat);
  }

  if (pro_eligibility_tests_addresse_id) {
    await kdb
      .updateTable('pro_eligibility_tests_addresses')
      .set({ demand_id: createdDemand.id })
      .where('id', '=', pro_eligibility_tests_addresse_id)
      .execute();
  } else if (lat && lon) {
    await createEligibilityTestAddress({
      address: values.address,
      demand_id: createdDemand.id,
      latitude: lat,
      longitude: lon,
    });
  }

  await autoAssignNetworkFromEligibility(createdDemand.id);

  const assignedDemand = await kdb
    .selectFrom('demands')
    .select(sql<number | null>`(legacy_values->>'Distance au réseau')::int`.as('distance'))
    .where('id', '=', createdDemand.id)
    .executeTakeFirstOrThrow();

  const demandForEmail = {
    ...legacyValues,
    'Distance au réseau': assignedDemand.distance,
  };

  await Promise.all([
    createEvent({
      context_id: createdDemand.id,
      context_type: 'demand',
      data: values,
      type: 'demand_created',
    }),
    sendEmailTemplate(
      'demands.demandeur.confirmation-demande',
      { email: values.email },
      {
        demand: {
          ...demandForEmail,
          Structure: legacyValues.Structure as any,
          'Type de chauffage': legacyValues['Type de chauffage'],
        },
      }
    ),
  ]);

  const demand = await getDemandById(createdDemand.id);

  return toDemandSubmissionResult(demand, false);
};

/**
 * Cherche une demande non supprimée avec le même email + la même adresse dans la fenêtre de dédoublonnage.
 * `email`/`address` sont déjà trimés par `createDemand` ; les valeurs stockées le sont aussi (trim à l'écriture + migration),
 * donc la comparaison n'a besoin que d'insensibilité à la casse (`lower`).
 */
const findRecentDemandByEmailAndAddress = (email: string, address: string) =>
  kdb
    .selectFrom('demands')
    .select(['id', 'legacy_values'])
    .where('deleted_at', 'is', null)
    .where(sql`lower(legacy_values->>'Mail')`, '=', email.toLowerCase())
    .where(sql`lower(legacy_values->>'Adresse')`, '=', address.toLowerCase())
    .where('created_at', '>', sql<Date>`now() - make_interval(days => ${DEMAND_DEDUP_WINDOW_DAYS})`)
    .orderBy('created_at', 'desc')
    .limit(1)
    .executeTakeFirst();

/** Projette une demande (créée ou existante) sur le payload minimal attendu par la dialog de confirmation. */
const toDemandSubmissionResult = (
  demand: { id: string; legacy_values: AirtableLegacyRecord },
  isExisting: boolean
): DemandSubmissionResult => ({
  address: demand.legacy_values.Adresse,
  createdAt: demand.legacy_values['Date de la demande'],
  distance: demand.legacy_values['Distance au réseau'] ?? null,
  email: demand.legacy_values.Mail,
  id: demand.id,
  isEligible: !!demand.legacy_values.Éligibilité,
  isExisting,
  networkName: demand.legacy_values['Nom réseau'] ?? null,
  status: demand.legacy_values.Status || DEMANDE_STATUS.TO_PROCESS,
});
