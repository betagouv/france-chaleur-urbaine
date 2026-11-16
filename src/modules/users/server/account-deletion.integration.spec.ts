import { beforeEach, describe, expect, it } from 'vitest';

import type { Context } from '@/server/api/crud';
import { kdb, sql } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { testUsers } from '@/tests/trpc-helpers';

import { list, remove } from './service';

const account = { email: 'camille@dalkia.test', first_name: 'Camille', id: uuid(1), phone: '0600000000', role: 'gestionnaire' as const };
const deletedEmail = `supprime-${account.id}@dalkia.test.invalid`;
const context = { user: { id: testUsers.admin.id } } as Context;

const countRows = async (
  table: 'pro_eligibility_tests' | 'pro_comparateur_configurations' | 'jobs' | 'email_templates' | 'user_permissions'
) =>
  Number(
    (await kdb.selectFrom(table).select(kdb.fn.countAll<number>().as('count')).where('user_id', '=', account.id).executeTakeFirstOrThrow())
      .count
  );

describe('account deletion', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await kdb.deleteFrom('user_tags').execute();
    await seedTableUser([testUsers.admin, account]);
  });

  it('keeps the row and the audit events without the identity, deletes the linked data and detaches the demands', async () => {
    const tag = await kdb.insertInto('user_tags').values({ color: '#000000', name: 'Webinaire' }).returning('id').executeTakeFirstOrThrow();
    await kdb.insertInto('user_tag_assignments').values({ tag_id: tag.id, user_id: account.id }).execute();
    await kdb.insertInto('user_permissions').values({ resource_id: '13', type: 'departement', user_id: account.id }).execute();
    await kdb.insertInto('pro_eligibility_tests').values({ has_unseen_results: false, name: 'Parc', user_id: account.id }).execute();
    await kdb
      .insertInto('pro_comparateur_configurations')
      .values({ id: uuid(20), name: 'Configuration', user_id: account.id })
      .execute();
    await kdb
      .insertInto('jobs')
      .values({ data: JSON.stringify({}), status: 'finished', type: 'pro_eligibility_test', user_id: account.id })
      .execute();
    await kdb
      .insertInto('email_templates')
      .values({ body: 'Bonjour', id: uuid(21), name: 'Modèle', subject: 'Objet', user_id: account.id })
      .execute();
    await kdb
      .insertInto('demands')
      .values({ id: uuid(30), legacy_values: JSON.stringify({}), user_id: account.id })
      .execute();
    await kdb
      .insertInto('events')
      .values([
        { author_id: account.id, context_id: uuid(30), context_type: 'demand', data: JSON.stringify({}), type: 'demand_validated' },
        {
          author_id: testUsers.admin.id,
          context_id: account.id,
          context_type: 'user',
          data: JSON.stringify({ changes: { first_name: 'Camille', phone: '0600000000' }, user_email: account.email }),
          type: 'user_updated_by_admin',
        },
      ])
      .execute();

    await remove(account.id, {}, context);

    const row = await kdb
      .selectFrom('users')
      .select(['active', 'email', 'first_name', 'phone', 'role', (eb) => eb('deleted_at', 'is not', null).as('deleted')])
      .where('id', '=', account.id)
      .executeTakeFirstOrThrow();
    const events = await kdb.selectFrom('events').select(['type', 'author_id', 'context_id', 'data']).orderBy('type').execute();
    const demand = await kdb.selectFrom('demands').select('user_id').where('id', '=', uuid(30)).executeTakeFirstOrThrow();
    expect({
      demand,
      events,
      linked: {
        email_templates: await countRows('email_templates'),
        jobs: await countRows('jobs'),
        pro_comparateur_configurations: await countRows('pro_comparateur_configurations'),
        pro_eligibility_tests: await countRows('pro_eligibility_tests'),
        user_permissions: await countRows('user_permissions'),
        user_tag_assignments: (await kdb.selectFrom('user_tag_assignments').select('tag_id').execute()).length,
      },
      listed: (await list()).items.map((user) => user.id),
      row,
    }).toStrictEqual({
      demand: { user_id: null },
      events: [
        { author_id: account.id, context_id: uuid(30), data: {}, type: 'demand_validated' },
        { author_id: testUsers.admin.id, context_id: account.id, data: { user_email: deletedEmail }, type: 'user_deleted_by_admin' },
        {
          author_id: testUsers.admin.id,
          context_id: account.id,
          data: { changes: { first_name: null, phone: null }, user_email: deletedEmail },
          type: 'user_updated_by_admin',
        },
      ],
      linked: {
        email_templates: 0,
        jobs: 0,
        pro_comparateur_configurations: 0,
        pro_eligibility_tests: 0,
        user_permissions: 0,
        user_tag_assignments: 0,
      },
      listed: [testUsers.admin.id],
      row: { active: false, deleted: true, email: deletedEmail, first_name: null, phone: null, role: 'gestionnaire' },
    });
  });

  it('refuses to delete an account twice', async () => {
    await remove(account.id, {}, context);

    await expect(remove(account.id, {}, context)).rejects.toThrow();
  });

  it('classifies every foreign key to users: a new one must be deleted with the account, detached or knowingly kept', async () => {
    // the row of a deleted account stays, so no cascade cleans these tables anymore: `remove` deletes them
    const deletedWithAccount = [
      'email_templates.user_id',
      'jobs.user_id',
      'pro_comparateur_configurations.user_id',
      'pro_eligibility_tests.user_id',
      'user_permissions.user_id',
      'user_tag_assignments.user_id',
    ];
    // found again by a new account on the same email
    const detached = ['demands.user_id'];
    // history and authorship: stay linked to the anonymized row
    const kept = [
      'ccrt_demand_emails.author_id',
      'ccrt_demand_notes.author_id',
      'conversion_ip_rules.created_by',
      'events.author_id',
      'network_change_requests.processed_by',
      'network_change_requests.user_id',
      'network_reminders.author_id',
    ];

    const { rows } = await sql<{ reference: string }>`
      SELECT constraints.conrelid::regclass::text || '.' || attributes.attname AS reference
      FROM pg_constraint AS constraints
      JOIN pg_attribute AS attributes ON attributes.attrelid = constraints.conrelid AND attributes.attnum = ANY (constraints.conkey)
      WHERE constraints.contype = 'f' AND constraints.confrelid = 'users'::regclass
      ORDER BY 1
    `.execute(kdb);

    expect(rows.map((row) => row.reference)).toStrictEqual([...deletedWithAccount, ...detached, ...kept].sort());
  });
});
