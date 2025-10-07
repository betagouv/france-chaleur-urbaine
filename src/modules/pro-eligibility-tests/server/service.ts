import { createUserEvent } from '@/modules/events/server/service';
import {
  type CreateEligibilityTestInput,
  type UpdateEligibilityTestInput,
  zCreateEligibilityTestInput,
  zUpdateEligibilityTestInput,
} from '@/modules/pro-eligibility-tests/constants';
import type { ProEligibilityTestEligibility, ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { kdb, sql } from '@/server/db/kysely';
import type { ApiContext, ListConfig } from '@/server/db/kysely/base-model';
import { getDetailedEligibilityStatus } from '@/server/services/addresseInformation';

export const tableName = 'pro_eligibility_tests';

const getTransition = (oldEligibility: ProEligibilityTestEligibility | undefined, newEligibility: ProEligibilityTestEligibility) => {
  if (!oldEligibility) {
    return 'initial';
  }
  if (JSON.stringify(oldEligibility) === JSON.stringify(newEligibility)) {
    return 'none';
  }
  return 'unknown';
};

/**
 * Calcule et met à jour l'historique d'éligibilité pour une adresse donnée
 */
export const updateAddressEligibilityHistory = async (addressId: string, latitude: number, longitude: number) => {
  // Récupérer l'historique existant
  const address = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .select(['eligibility_history'])
    .where('id', '=', addressId)
    .executeTakeFirstOrThrow();

  const existingHistory = (address.eligibility_history as ProEligibilityTestHistoryEntry[]) || [];

  // Calculer la nouvelle éligibilité
  const eligibility = await getDetailedEligibilityStatus(latitude, longitude);

  const newEligibility: ProEligibilityTestEligibility = {
    distance: eligibility.distance,
    id_fcu: eligibility.id_fcu,
    id_sncu: eligibility.id_sncu,
    nom: eligibility.nom,
    type: eligibility.type,
  };

  // Déterminer la transition
  const lastEligibility = existingHistory[existingHistory.length - 1];
  const transition = getTransition(lastEligibility?.eligibility, newEligibility);

  // Créer la nouvelle entrée d'historique
  const historyEntry: ProEligibilityTestHistoryEntry = {
    calculated_at: new Date().toISOString(),
    eligibility: newEligibility,
    transition,
  };

  // Ajouter à l'historique
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
    addresses: addresses.map((address) => ({
      ...address,
      eligibility_status: {
        ...address.eligibility_status,
        etat_reseau:
          address.eligibility_status === null || !address.eligibility_status || !address.eligibility_status?.isEligible
            ? 'aucun'
            : address.eligibility_status.futurNetwork
              ? 'en_construction'
              : 'existant',
      },
    })),
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
  await kdb.updateTable('pro_eligibility_tests').where('id', '=', testId).set({ has_unseen_results: false }).execute();
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
