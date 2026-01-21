import { createUserEvent } from '@/modules/events/server/service';
import type { BoundingBox } from '@/modules/geo/types';
import {
  type CreateEligibilityTestInput,
  type TransitionType,
  type UpdateEligibilityTestInput,
  zCreateEligibilityTestInput,
  zUpdateEligibilityTestInput,
} from '@/modules/pro-eligibility-tests/constants';
import type { ProEligibilityTestEligibility, ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { kdb, sql } from '@/server/db/kysely';
import type { ApiContext, ListConfig } from '@/server/db/kysely/base-model';
import { parentLogger } from '@/server/helpers/logger';
import { type EligibilityType, getDetailedEligibilityStatus } from '@/server/services/addresseInformation';
import { getBANAddressFromAddress, getBANAddressFromCoordinates } from '@/server/services/api-adresse';
import { isDefined } from '@/utils/core';

const logger = parentLogger.child({ module: 'pro-eligibility-tests' });

export const tableName = 'pro_eligibility_tests';

/**
 * Détermine le type de transition entre deux états d'éligibilité
 * Description des transitions dans le fichier TRANSITION_TYPES.md
 *
 * @param oldEligibility - État précédent (undefined si premier calcul)
 * @param newEligibility - Nouvel état
 * @returns Type de transition détaillé
 */
export const getTransition = (
  oldEligibility: ProEligibilityTestEligibility | undefined,
  newEligibility: ProEligibilityTestEligibility
): TransitionType => {
  // Premier calcul
  if (!oldEligibility) {
    return 'initial';
  }

  // Aucun changement
  // Helper pour comparer les distances en gérant les cas null
  const distancesEqual = (oldDist: number | null, newDist: number | null): boolean => {
    // Si les deux sont null, elles sont égales
    if (oldDist === null && newDist === null) {
      return true;
    }
    // Si une seule est null, elles ne sont pas égales
    if (oldDist === null || newDist === null) {
      return false;
    }
    // Comparaison avec tolérance de 5m pour éviter les variations GPS
    return Math.abs(oldDist - newDist) < 5;
  };

  if (
    oldEligibility.type === newEligibility.type &&
    oldEligibility.id_fcu === newEligibility.id_fcu &&
    oldEligibility.id_sncu === newEligibility.id_sncu &&
    distancesEqual(oldEligibility.distance, newEligibility.distance)
  ) {
    return 'none';
  }

  const isExistingNetwork = (type: EligibilityType) => type.includes('reseau_existant');
  const isFutureNetwork = (type: EligibilityType) => type.includes('reseau_futur');
  const isPDP = (type: EligibilityType) => type === 'dans_pdp_reseau_existant' || type === 'dans_pdp_reseau_futur';
  const isInCity = (type: EligibilityType) => type === 'dans_ville_reseau_existant_sans_trace';
  const isTooFar = (type: EligibilityType) => type === 'trop_eloigne';

  const oldType = oldEligibility.type;
  const newType = newEligibility.type;

  // Entrée dans un PDP
  if (!isPDP(oldType) && isPDP(newType)) {
    return 'entree_pdp';
  }

  // Sortie d'un PDP
  if (isPDP(oldType) && !isPDP(newType)) {
    return 'sortie_pdp';
  }

  // Réseau futur devient existant (construction terminée)
  if (isFutureNetwork(oldType) && isExistingNetwork(newType)) {
    return 'futur_vers_existant';
  }

  // Passage de trop éloigné vers un réseau
  if (isTooFar(oldType) && !isTooFar(newType)) {
    if (isFutureNetwork(newType)) {
      return 'nouveau_reseau_futur';
    }
    if (isExistingNetwork(newType)) {
      return 'nouveau_reseau_existant';
    }
    return 'nouveau_reseau';
  }

  // Passage d'un réseau vers trop éloigné
  if (!isTooFar(oldType) && isTooFar(newType)) {
    return 'reseau_supprime';
  }

  // Changement de réseau (id_fcu différent)
  if (oldEligibility.id_fcu !== newEligibility.id_fcu) {
    return 'changement_reseau';
  }

  // Changement de distance significatif (>50m) avec même type
  // Ne s'applique que si les deux distances sont définies (non null)
  if (oldType === newType && oldEligibility.distance !== null && newEligibility.distance !== null) {
    const distanceChange = newEligibility.distance - oldEligibility.distance;
    if (Math.abs(distanceChange) >= 50) {
      if (distanceChange > 0) {
        return 'eloignement';
      }
      return 'rapprochement';
    }
  }

  // Changement de type (proche -> tres_proche, loin -> proche, etc.)
  if (oldType !== newType) {
    // Amélioration de proximité
    if (
      (oldType === 'reseau_existant_loin' && newType === 'reseau_existant_proche') ||
      (oldType === 'reseau_existant_proche' && newType === 'reseau_existant_tres_proche') ||
      (oldType === 'reseau_futur_loin' && newType === 'reseau_futur_proche') ||
      (oldType === 'reseau_futur_proche' && newType === 'reseau_futur_tres_proche') ||
      newType === 'dans_zone_reseau_futur'
    ) {
      return 'amelioration_proximite';
    }

    // Dégradation de proximité
    if (
      (oldType === 'reseau_existant_tres_proche' && newType === 'reseau_existant_proche') ||
      (oldType === 'reseau_existant_proche' && newType === 'reseau_existant_loin') ||
      (oldType === 'reseau_futur_tres_proche' && newType === 'reseau_futur_proche') ||
      (oldType === 'reseau_futur_proche' && newType === 'reseau_futur_loin') ||
      (oldType === 'dans_zone_reseau_futur' && isFutureNetwork(newType))
    ) {
      return 'degradation_proximite';
    }

    // Entrée/sortie de ville avec réseau sans trace
    if (!isInCity(oldType) && isInCity(newType)) {
      return 'entree_ville_reseau_sans_trace';
    }
    if (isInCity(oldType) && !isInCity(newType)) {
      return 'sortie_ville_reseau_sans_trace';
    }

    return 'changement_type';
  }

  // Cas par défaut pour changements mineurs
  return 'modification_mineure';
};

/**
 * Crée une entrée d'historique d'éligibilité pour une adresse
 * @param latitude - Latitude de l'adresse
 * @param longitude - Longitude de l'adresse
 * @param previousEligibility - État d'éligibilité précédent (undefined pour le calcul initial)
 * @returns Nouvelle entrée d'historique
 */
export const getAddressEligibilityHistoryEntry = async (
  latitude: number,
  longitude: number,
  previousEligibility?: ProEligibilityTestEligibility
): Promise<ProEligibilityTestHistoryEntry> => {
  const eligibility = await getDetailedEligibilityStatus(latitude, longitude);

  const newEligibility: ProEligibilityTestEligibility = {
    contenu_co2_acv: eligibility.eligible ? (eligibility.reseauDeChaleur?.['contenu CO2 ACV'] ?? undefined) : undefined,
    distance: eligibility.distance,
    eligible: eligibility.eligible,
    id_fcu: eligibility.id_fcu,
    id_sncu: eligibility.id_sncu,
    nom: eligibility.nom,
    taux_enrr: eligibility.eligible ? (eligibility.reseauDeChaleur?.['Taux EnR&R'] ?? undefined) : undefined,
    type: eligibility.type,
  };

  const transition = getTransition(previousEligibility, newEligibility);

  const historyEntry: ProEligibilityTestHistoryEntry = {
    calculated_at: new Date().toISOString(),
    eligibility: newEligibility,
    transition,
  };

  return historyEntry;
};

/**
 * Crée les données d'adresse à partir d'un résultat BAN API déjà existant
 * Utilisé par les jobs batch pour éviter de refaire des appels BAN
 * @param addressItem - Résultat de l'API BAN (getAddressesCoordinates ou getCoordinatesAddresses)
 * @param options - Options pour test_id ou demand_id
 * @returns Données d'adresse formatées pour insertion en base
 */
export const createAddressDataFromBAN = async (
  addressItem: { address?: string; latitude?: number; longitude?: number } & (
    | { result_status: 'ok'; latitude: number; longitude: number; result_label: string; result_score: number }
    | { result_status: string; result_label: string; result_score?: number }
  ),
  options?: { test_id?: string; demand_id?: string }
) => {
  const historyEntry =
    addressItem.result_status === 'ok' ? await getAddressEligibilityHistoryEntry(addressItem.latitude!, addressItem.longitude!) : null;

  return {
    ban_address: addressItem.result_label,
    ban_score: isDefined(addressItem.result_score) ? Math.round(addressItem.result_score * 100) : null,
    ban_valid: addressItem.result_status === 'ok',
    eligibility_history: historyEntry ? JSON.stringify([historyEntry]) : null,
    geom: historyEntry
      ? (sql`st_transform(st_point(${addressItem.longitude!}, ${addressItem.latitude!}, 4326), 2154)` as unknown as any)
      : null,
    source_address: (addressItem.address as string) || '',
    ...options,
  };
};

export const buildEligibilityTestAddress = async (input: { address: string } | { latitude: number; longitude: number }) => {
  const addressItem =
    'address' in input
      ? await getBANAddressFromAddress(input.address, logger)
      : await getBANAddressFromCoordinates(input.latitude, input.longitude, logger);

  // Use input coordinates if provided, otherwise use BAN result
  const latitude = 'latitude' in input ? input.latitude : addressItem.latitude;
  const longitude = 'longitude' in input ? input.longitude : addressItem.longitude;

  // Validate coordinates
  if (!isDefined(latitude) || !isDefined(longitude) || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new Error(`Invalid coordinates for address: lat=${latitude}, lon=${longitude}`);
  }

  // Créer un addressItem modifié avec les coordonnées finales (input > BAN)
  const modifiedAddressItem = {
    ...addressItem,
    latitude,
    longitude,
  };

  return await createAddressDataFromBAN(modifiedAddressItem);
};

export const createEligibilityTestAddress = async ({
  demand_id,
  ...input
}: ({ address: string } | { latitude: number; longitude: number }) & { demand_id: string }) => {
  const addressData = await buildEligibilityTestAddress(input);

  const testAddress = await kdb
    .insertInto('pro_eligibility_tests_addresses')
    .values({
      ...addressData,
      demand_id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return testAddress;
};

/**
 * Calcule et met à jour l'historique d'éligibilité pour une adresse donnée
 */
export const updateAddressEligibilityHistory = async (addressId: string, latitude: number, longitude: number) => {
  // Récupère l'historique existant
  const address = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .select(['eligibility_history'])
    .where('id', '=', addressId)
    .executeTakeFirstOrThrow();

  const existingHistory = (address.eligibility_history as ProEligibilityTestHistoryEntry[]) || [];

  // Calcule la nouvelle entrée d'historique
  const lastEligibility = existingHistory[existingHistory.length - 1];
  const historyEntry = await getAddressEligibilityHistoryEntry(latitude, longitude, lastEligibility?.eligibility);

  // Ajoute à l'historique
  const updatedHistory = [...existingHistory, historyEntry];

  // Mettre à jour en base
  await kdb
    .updateTable('pro_eligibility_tests_addresses')
    .set({
      eligibility_history: JSON.stringify(updatedHistory),
    })
    .where('id', '=', addressId)
    .execute();

  return historyEntry;
};

export const listAdmin = async () => {
  const tests = await kdb
    .selectFrom('pro_eligibility_tests')
    .selectAll('pro_eligibility_tests')
    .innerJoin('users', 'users.id', 'pro_eligibility_tests.user_id')
    .where('deleted_at', 'is', null)
    .select((eb) => [
      eb.ref('users.email').as('user_email'),
      eb
        .exists(
          eb
            .selectFrom('jobs')
            .whereRef('jobs.entity_id', '=', 'pro_eligibility_tests.id')
            .where('jobs.status', 'in', ['pending', 'processing'])
            .select('jobs.id')
        )
        .as('has_pending_jobs'),
      eb
        .selectFrom('jobs')
        .whereRef('jobs.entity_id', '=', 'pro_eligibility_tests.id')
        .select((eb) => eb.case().when('status', '=', 'error').then(true).else(false).end().as('has_error'))
        .orderBy('created_at', 'desc')
        .limit(1)
        .as('last_job_has_error'),
    ])
    .orderBy('pro_eligibility_tests.created_at', 'desc')
    .execute();

  return {
    count: tests.length,
    items: tests,
  };
};

export const list = async (_: ListConfig<typeof tableName>, context: ApiContext) => {
  const eligibilityTests = await kdb
    .selectFrom('pro_eligibility_tests')
    .where('user_id', '=', context.user.id)
    .where('deleted_at', 'is', null)
    .selectAll()
    .select((eb) => [
      eb
        .exists(
          eb
            .selectFrom('jobs')
            .whereRef('jobs.entity_id', '=', 'pro_eligibility_tests.id')
            .where('jobs.status', 'in', ['pending', 'processing'])
            .select('jobs.id')
        )
        .as('has_pending_jobs'),
      eb
        .selectFrom('jobs')
        .whereRef('jobs.entity_id', '=', 'pro_eligibility_tests.id')
        .select((eb) => eb.case().when('status', '=', 'error').then(true).else(false).end().as('has_error'))
        .orderBy('created_at', 'desc')
        .limit(1)
        .as('last_job_has_error'),
    ])
    .orderBy('created_at desc')
    .execute();

  return {
    count: eligibilityTests.length,
    items: eligibilityTests,
  };
};

export const get = async (testId: string, _config: ListConfig<typeof tableName>, context: ApiContext) => {
  // admins can see all tests
  if (context.user.role !== 'admin') {
    await ensureValidPermissions(context, testId);
  }

  const eligibilityTest = await kdb
    .selectFrom('pro_eligibility_tests')
    .where('id', '=', testId)
    .selectAll()
    .select((eb) => [
      eb
        .exists(
          eb
            .selectFrom('jobs')
            .whereRef('jobs.entity_id', '=', 'pro_eligibility_tests.id')
            .where('jobs.status', 'in', ['pending', 'processing'])
            .select('jobs.id')
        )
        .as('has_pending_jobs'),
      eb
        .selectFrom('jobs')
        .whereRef('jobs.entity_id', '=', 'pro_eligibility_tests.id')
        .select((eb) => eb.case().when('status', '=', 'error').then(true).else(false).end().as('has_error'))
        .orderBy('created_at', 'desc')
        .limit(1)
        .as('last_job_has_error'),
    ])
    .executeTakeFirstOrThrow();

  const addresses = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .where('test_id', '=', testId)
    .selectAll()
    .select([sql`ST_AsGeoJSON(st_transform(geom, 4326))::json`.as('geom')])
    .execute();

  return {
    ...eligibilityTest,
    addresses: addresses.map((address) => {
      const history = address.eligibility_history as ProEligibilityTestHistoryEntry[] | null;
      const lastEligibility = history?.[history.length - 1] as ProEligibilityTestHistoryEntry;
      return {
        ...address,
        eligibility: lastEligibility?.eligibility,
        eligibility_history: history,
        etat_reseau:
          lastEligibility?.eligibility.type &&
          (['dans_pdp_reseau_existant', 'reseau_existant_tres_proche', 'reseau_existant_proche'] as EligibilityType[]).includes(
            lastEligibility.eligibility.type
          )
            ? 'existant'
            : lastEligibility?.eligibility.type &&
                (
                  [
                    'dans_pdp_reseau_futur',
                    'reseau_futur_tres_proche',
                    'dans_zone_reseau_futur',
                    'reseau_futur_proche',
                  ] as EligibilityType[]
                ).includes(lastEligibility.eligibility.type)
              ? 'en_construction'
              : 'aucun',
        in_pdp:
          lastEligibility?.eligibility.type === 'dans_pdp_reseau_existant' || lastEligibility?.eligibility.type === 'dans_pdp_reseau_futur',
      };
    }),
  };
};

export const create = async ({ name, ...input }: CreateEligibilityTestInput, context: ApiContext) => {
  const createdItem = await kdb.transaction().execute(async (trx) => {
    const createdEligibilityTest = await trx
      .insertInto('pro_eligibility_tests')
      .values({
        has_unseen_results: false,
        name,
        user_id: context.user.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await trx
      .insertInto('jobs')
      .values({
        data: input,
        entity_id: createdEligibilityTest.id,
        status: 'pending',
        type: 'pro_eligibility_test',
        user_id: context.user.id,
      })
      .executeTakeFirstOrThrow();

    return createdEligibilityTest;
  });

  await createUserEvent({
    author_id: context.user.id,
    context_id: createdItem.id,
    context_type: 'pro_eligibility_test',
    data: { name },
    type: 'pro_eligibility_test_created',
  });

  return createdItem;
};

export const rename = async (
  testId: string,
  updatedData: UpdateEligibilityTestInput,
  _config: ListConfig<typeof tableName>,
  context: ApiContext
) => {
  await ensureValidPermissions(context, testId);

  const updatedItem = await kdb
    .updateTable('pro_eligibility_tests')
    .where('id', '=', testId)
    .set(updatedData)
    .returningAll()
    .executeTakeFirstOrThrow();

  await createUserEvent({
    author_id: context.user.id,
    context_id: testId,
    context_type: 'pro_eligibility_test',
    type: 'pro_eligibility_test_renamed',
  });

  return updatedItem;
};

export const update = async (
  testId: string,
  updatedData: UpdateEligibilityTestInput,
  _config: ListConfig<typeof tableName>,
  context: ApiContext
) => {
  await ensureValidPermissions(context, testId);

  const updatedItem = await kdb
    .updateTable('pro_eligibility_tests')
    .where('id', '=', testId)
    .set({ has_unseen_results: true })
    .returningAll()
    .executeTakeFirstOrThrow();

  await kdb
    .insertInto('jobs')
    .values({
      data: updatedData,
      entity_id: testId,
      status: 'pending',
      type: 'pro_eligibility_test',
      user_id: context.user.id,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  await createUserEvent({
    author_id: context.user.id,
    context_id: testId,
    context_type: 'pro_eligibility_test',
    type: 'pro_eligibility_test_updated',
  });

  return updatedItem;
};

export const updateAddress = async (
  addressId: string,
  { latitude, longitude, address }: { latitude: number; longitude: number; address: string },
  _context: ApiContext
) => {
  const existingAddress = await kdb.selectFrom('pro_eligibility_tests_addresses').where('id', '=', addressId).executeTakeFirst();

  if (!existingAddress) {
    throw new Error('Address not found');
  }

  // Utilise buildEligibilityTestAddress pour construire les données de l'adresse
  const addressData = await buildEligibilityTestAddress({ latitude, longitude });

  // Extraire les informations du réseau depuis l'historique d'éligibilité
  const eligibilityHistory = JSON.parse(addressData.eligibility_history!) as ProEligibilityTestHistoryEntry[];
  const lastEligibility = eligibilityHistory[0]?.eligibility;
  const networkId = lastEligibility?.id_sncu || null;
  const networkName = lastEligibility?.nom || null;

  // Mettre à jour l'adresse avec les nouvelles données
  const updatedAddress = await kdb
    .updateTable('pro_eligibility_tests_addresses')
    .set(addressData)
    .where('id', '=', addressId)
    .returningAll()
    .executeTakeFirstOrThrow();

  // Si l'adresse est liée à une demande, mettre à jour aussi les coordonnées, l'adresse et les infos réseau
  if (updatedAddress.demand_id) {
    const legacyValuesUpdate = {
      Adresse: address,
      'Identifiant réseau': networkId,
      Latitude: latitude,
      Longitude: longitude,
      'Nom réseau': networkName,
    };

    await kdb
      .updateTable('demands')
      .set({
        legacy_values: sql`legacy_values || ${JSON.stringify(legacyValuesUpdate)}::jsonb`,
      })
      .where('id', '=', updatedAddress.demand_id)
      .execute();
  }

  return updatedAddress;
};

export const remove = async (testId: string, _config: ListConfig<typeof tableName>, context: ApiContext) => {
  await ensureValidPermissions(context, testId);
  const removedItem = await kdb
    .updateTable('pro_eligibility_tests')
    .where('id', '=', testId)
    .set({
      deleted_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  await createUserEvent({
    author_id: context.user.id,
    context_id: testId,
    context_type: 'pro_eligibility_test',
    type: 'pro_eligibility_test_deleted',
  });

  return removedItem;
};

export const markAsSeen = async (testId: string, context: ApiContext) => {
  await ensureValidPermissions(context, testId);
  await kdb
    .updateTable('pro_eligibility_tests')
    .where('id', '=', testId)
    .set({
      has_unseen_changes: false,
      has_unseen_results: false,
    })
    .execute();
};

export async function ensureValidPermissions(context: ApiContext, testId: string) {
  const test = await kdb
    .selectFrom('pro_eligibility_tests')
    .select('user_id')
    .where('id', '=', testId)
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();

  if (test.user_id !== context.user.id) {
    throw new Error('permissions invalides');
  }
}

export const validation = {
  create: zCreateEligibilityTestInput,
  update: zUpdateEligibilityTestInput,
};

/**
 * Crée un job pour vérifier les changements d'éligibilité dans les zones affectées
 * Ce job sera traité en arrière-plan et vérifiera toutes les adresses dans les bboxes données
 */
export const createWarnEligibilityChangesJob = async (bboxes: BoundingBox[], context: ApiContext) => {
  return await kdb
    .insertInto('jobs')
    .values({
      data: {
        bboxes,
      },
      status: 'pending',
      type: 'pro_eligibility_test_notify_changes',
      user_id: context.user.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};
