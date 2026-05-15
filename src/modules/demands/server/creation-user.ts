import type { Selectable } from 'kysely';

import { clientConfig } from '@/client-config';
import { type CreateDemandInput, formatDataToLegacyAirtable } from '@/modules/demands/constants';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import { createEligibilityTestAddress } from '@/modules/pro-eligibility-tests/server/service';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { kdb, type ProEligibilityTestsAddresses, sql } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import {
  autoAssignNetworkFromEligibility,
  fillDemandTerritoryFromCoords,
  getBatimentInfoAtCoords,
  getConsommationGazAdresse,
} from './eligibility';
import { enrichDemandForAdmin, getDemandById } from './helpers';

/**
 * Crée une demande côté utilisateur : enrichit avec la conso gaz / bâtiment BNB,
 * auto-assigne un réseau d'après l'éligibilité, et déclenche les emails user + admin.
 */
export const createDemand = async (
  values: CreateDemandInput,
  { userId, pro_eligibility_tests_addresse_id }: { userId?: string; pro_eligibility_tests_addresse_id?: string } = {}
) => {
  let testAddressFromDB: Omit<Selectable<ProEligibilityTestsAddresses>, 'eligibility_history'> | null = null;

  const { lat, lon } = values.coords;
  const legacyValues = formatDataToLegacyAirtable(values);

  const [conso, nbLogement] = await Promise.all([
    getConsommationGazAdresse(lat, lon),
    values.nbLogements ? { batiment_groupe_id: undefined, nb_logements: values.nbLogements } : getBatimentInfoAtCoords(lat, lon),
  ]);

  const [createdDemand] = await kdb
    .insertInto('demands')
    .values({
      created_at: new Date(),
      legacy_values: sql<string>`${JSON.stringify({
        ...legacyValues,
        Conso: conso ? conso.conso_nb : undefined,
        'Date de la demande': new Date().toISOString(),
        'ID BNB': nbLogement?.batiment_groupe_id ? `${nbLogement.batiment_groupe_id}` : undefined,
        'ID réseau le plus proche': null,
        Logement: nbLogement?.nb_logements ? nbLogement.nb_logements : undefined,
        'Relance à activer': values.eligibility.isEligible && values.heatingType === 'collectif',
        Status: values.eligibility.isEligible ? undefined : DEMANDE_STATUS.UNREALISABLE,
      })}::jsonb`,
      updated_at: new Date(),
      user_id: userId ?? null,
    })
    .returningAll()
    .execute();

  if (lat && lon) {
    await fillDemandTerritoryFromCoords(createdDemand.id, lon, lat);
  }

  if (pro_eligibility_tests_addresse_id) {
    const updatedTestAddress = await kdb
      .updateTable('pro_eligibility_tests_addresses')
      .set({ demand_id: createdDemand.id })
      .returningAll()
      .where('id', '=', pro_eligibility_tests_addresse_id)
      .executeTakeFirst();
    if (updatedTestAddress) {
      testAddressFromDB = updatedTestAddress;
    }
  } else if (lat && lon) {
    const createdTestAddress = await createEligibilityTestAddress({
      address: values.address,
      demand_id: createdDemand.id,
      latitude: lat,
      longitude: lon,
    });
    if (createdTestAddress) {
      testAddressFromDB = createdTestAddress;
    }
  }

  const testAddress = testAddressFromDB as Selectable<ProEligibilityTestsAddresses> & {
    eligibility_history: ProEligibilityTestHistoryEntry[];
  };

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
          'Type de chauffage': legacyValues['Type de chauffage'] as 'Collectif' | 'Autre / Je ne sais pas' | 'Individuel',
        },
      }
    ),
    // Automation import from https://airtable.com/app9opX8gRAtBqkan/wflvqEW0CLeXZ2pO0
    sendEmailTemplate(
      'demands.equipe-fcu.nouvelle-demande',
      { email: clientConfig.destinationEmails.contact },
      { demand: demandForEmail as any }
    ),
  ]);

  const demand = await getDemandById(createdDemand.id);

  return enrichDemandForAdmin({ demand, testAddress });
};
