import { createUserEvent } from '@/modules/events/server/service';
import {
  type CreateEligibilityTestInput,
  type UpdateEligibilityTestInput,
  zCreateEligibilityTestInput,
  zUpdateEligibilityTestInput,
} from '@/modules/pro-eligibility-tests/constants';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { type ApiContext, createBaseModel, type ListConfig } from '@/server/db/kysely/base-model';

export const tableName = 'pro_eligibility_tests';

const baseModel = createBaseModel(tableName);

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
  return tests;
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
    items: eligibilityTests,
    count: eligibilityTests.length,
  };
};

export const get = async (testId: string, _config: ListConfig<typeof tableName>, context: ApiContext) => {
  // admins can see all tests
  if (context.user.role !== 'admin') {
    ensureValidPermissions(context, testId);
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
        name,
        user_id: context.user.id,
        has_unseen_results: false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await trx
      .insertInto('jobs')
      .values({
        type: 'pro_eligibility_test',
        data: input,
        status: 'pending',
        entity_id: createdEligibilityTest.id,
        user_id: context.user.id,
      })
      .executeTakeFirstOrThrow();

    return createdEligibilityTest;
  });

  await createUserEvent({
    type: 'pro_eligibility_test_created',
    context_type: 'pro_eligibility_test',
    context_id: createdItem.id,
    data: { name },
    author_id: context.user.id,
  });

  return createdItem;
};

export const update = async (
  testId: string,
  updatedData: UpdateEligibilityTestInput,
  _config: ListConfig<typeof tableName>,
  context: ApiContext
) => {
  await ensureValidPermissions(context, testId);

  const hasNewAddresses = updatedData.content && updatedData.content.length > 0;

  if (Object.keys(updatedData).length === 1 && 'name' in updatedData) {
    const updatedItem = await kdb
      .updateTable('pro_eligibility_tests')
      .where('id', '=', testId)
      .set({ ...updatedData, ...(hasNewAddresses ? { has_unseen_results: true } : {}) })
      .returningAll()
      .execute();
    await createUserEvent({
      type: 'pro_eligibility_test_renamed',
      context_type: 'pro_eligibility_test',
      context_id: testId,
      author_id: context.user.id,
    });

    return updatedItem as unknown as DB[typeof tableName];
  }

  if (hasNewAddresses) {
    const updatedItem = await kdb
      .updateTable('pro_eligibility_tests')
      .where('id', '=', testId)
      .set({ has_unseen_results: true })
      .returningAll()
      .execute();

    await kdb
      .insertInto('jobs')
      .values({
        type: 'pro_eligibility_test',
        data: updatedData,
        status: 'pending',
        entity_id: testId,
        user_id: context.user.id,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    await createUserEvent({
      type: 'name' in updatedData ? 'pro_eligibility_test_renamed' : 'pro_eligibility_test_updated',
      context_type: 'pro_eligibility_test',
      context_id: testId,
      author_id: context.user.id,
    });

    return updatedItem as unknown as DB[typeof tableName];
  }

  throw new Error('No updated data');
};

export const remove: typeof baseModel.remove = async (testId, _config, context) => {
  await ensureValidPermissions(context, testId);
  const removedItem = await kdb
    .updateTable('pro_eligibility_tests')
    .where('id', '=', testId)
    .set({
      deleted_at: new Date(),
    })
    .returningAll()
    .execute();

  await createUserEvent({
    type: 'pro_eligibility_test_deleted',
    context_type: 'pro_eligibility_test',
    context_id: testId,
    author_id: context.user.id,
  });

  return removedItem as unknown as DB[typeof tableName];
};

export const markAsSeen = async (testId: string, context: ApiContext) => {
  await ensureValidPermissions(context, testId);
  await kdb.updateTable('pro_eligibility_tests').where('id', '=', testId).set({ has_unseen_results: false }).execute();
};

export async function ensureValidPermissions(context: ApiContext, testId: string) {
  const test = await kdb.selectFrom('pro_eligibility_tests').select('user_id').where('id', '=', testId).executeTakeFirstOrThrow();

  if (test.user_id !== context.user.id) {
    throw new Error('permissions invalides');
  }
}

export const validation = {
  create: zCreateEligibilityTestInput,
  update: zUpdateEligibilityTestInput,
};
