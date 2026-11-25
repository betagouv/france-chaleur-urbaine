import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmailTemplate } from '@/modules/email';
import * as eventsService from '@/modules/events/server/service';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedDemandeChaleurRenouvelable, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT, DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS } from '../constants';
import * as ccrtAccess from './ccrt-access';

vi.mock('@/modules/email', () => ({ sendEmailTemplate: vi.fn() }));

beforeEach(async () => {
  await cleanDatabase();
  await seedTableUser(Object.values(testUsers));
  await kdb.insertInto('user_permissions').values({ resource_id: '75', type: 'departement', user_id: testUsers.ccrt.id }).execute();
  vi.clearAllMocks();
});
afterEach(() => vi.restoreAllMocks());

describe('CCRT demand reopening permissions', () => {
  const cases: TestCaseBoolean<(typeof testUsers)[keyof typeof testUsers] | null>[] = [
    { expectedOutput: false, input: null },
    ...Object.values(testUsers).map((user) => ({ expectedOutput: user.role === 'admin', input: user })),
  ];
  cases.forEach(({ input: user, expectedOutput: allowed }) => {
    it(`restricts reopening for ${user?.role ?? 'anonymous'}`, async () => {
      const demand = await seedDemandeChaleurRenouvelable({ validated: true });
      const route = createTestCaller(user).batEnr.admin;
      const operation = route.reopenDemand({ demandId: demand.id, updatedAt: demand.updated_at.toISOString() });
      if (allowed) {
        await expect(operation).resolves.toEqual(expect.any(Object));
      } else {
        await expect(operation).rejects.toMatchObject(forbiddenError);
      }
    });
  });
});

describe('CCRT demand reopening', () => {
  const emailContent = { body: 'Bonjour', cc: '', object: 'Prise de contact', replyTo: 'conseiller@example.fr', signature: 'Conseiller' };

  it('waits for an ongoing email to finish before allowing withdrawal, preserving the successful delivery and status', async () => {
    const demand = await seedDemandeChaleurRenouvelable({ departement_code: '75', validated: true });
    const admin = createTestCaller(testUsers.admin).batEnr.admin;
    const input = { demandId: demand.id, updatedAt: demand.updated_at.toISOString() };
    vi.mocked(sendEmailTemplate).mockImplementationOnce(async () => {
      await expect(admin.reopenDemand(input)).rejects.toMatchObject({
        code: 'CONFLICT',
        message: expect.stringContaining('email est en cours'),
      });
    });
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.sendEmail({
      demandId: demand.id,
      emailContent,
      messageId: uuid(810),
      updateStatusOnSend: true,
    });
    const context = (await admin.listDemandesChaleurRenouvelable()).items[0];
    await admin.reopenDemand({ demandId: demand.id, updatedAt: context.updated_at });
    expect(await kdb.selectFrom('demands_chaleur_renouvelable').select(['status', 'validated']).executeTakeFirstOrThrow()).toStrictEqual({
      status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
      validated: false,
    });
    expect(await kdb.selectFrom('ccrt_demand_emails').select(['status', 'sent_at']).executeTakeFirstOrThrow()).toStrictEqual({
      sent_at: expect.any(Date),
      status: 'sent',
    });
    expect(sendEmailTemplate).toHaveBeenCalledTimes(1);
  });

  it('rejects an email before SMTP if withdrawal happened between its access check and its reservation', async () => {
    const demand = await seedDemandeChaleurRenouvelable({ departement_code: '75', validated: true });
    const originalAccessCheck = ccrtAccess.ensureCcrtDemandAccess;
    vi.spyOn(ccrtAccess, 'ensureCcrtDemandAccess').mockImplementationOnce(async (...args) => {
      const snapshot = await originalAccessCheck(...args);
      await createTestCaller(testUsers.admin).batEnr.admin.reopenDemand({
        demandId: demand.id,
        updatedAt: demand.updated_at.toISOString(),
      });
      return snapshot;
    });
    await expect(
      createTestCaller(testUsers.ccrt).batEnr.ccrt.sendEmail({ demandId: demand.id, emailContent, messageId: uuid(811) })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(sendEmailTemplate).not.toHaveBeenCalled();
    expect(await kdb.selectFrom('ccrt_demand_emails').select('id').execute()).toStrictEqual([]);
  });

  it('warns about the latest CCRT status change, including a return to the initial status, but ignores admin changes and notes', async () => {
    const demand = await seedDemandeChaleurRenouvelable({ validated: true });
    const changes = [
      {
        author: testUsers.ccrt.id,
        date: '2026-11-04',
        from: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
        to: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
      },
      {
        author: testUsers.ccrt.id,
        date: '2026-11-05',
        from: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
        to: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
      },
      {
        author: testUsers.admin.id,
        date: '2026-11-06',
        from: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
        to: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
      },
    ];
    for (const { author, date, from, to } of changes) {
      await kdb
        .insertInto('events')
        .values({
          author_id: author,
          context_id: demand.id,
          context_type: 'ccrt_demand',
          created_at: new Date(`${date}T10:00:00.000Z`),
          data: JSON.stringify({ changes: { status: { from, to } } }),
          type: 'ccrt_demand_updated',
        })
        .execute();
    }
    await kdb
      .insertInto('events')
      .values({
        author_id: testUsers.ccrt.id,
        context_id: demand.id,
        context_type: 'ccrt_demand',
        created_at: new Date('2026-11-07T10:00:00.000Z'),
        data: JSON.stringify({ changes: { assigned_to: { from: null, to: testUsers.ccrt.id } } }),
        type: 'ccrt_demand_updated',
      })
      .execute();
    expect(
      (await createTestCaller(testUsers.admin).batEnr.admin.listDemandesChaleurRenouvelable()).items[0].last_ccrt_status_change
    ).toStrictEqual({
      date: '2026-11-05T10:00:00.000Z',
      status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
    });
  });

  it('withdraws and republishes the same demand with its access, status, assignment, notes and emails preserved, without sending email', async () => {
    const demand = await seedDemandeChaleurRenouvelable({
      assigned_to: testUsers.ccrt.id,
      departement_code: '75',
      notified_at: new Date('2026-11-05T10:00:00.000Z'),
      status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
      validated: true,
    });
    const note = await kdb
      .insertInto('ccrt_demand_notes')
      .values({ author_id: testUsers.ccrt.id, body: 'Suivi conservé', demand_id: demand.id })
      .returningAll()
      .executeTakeFirstOrThrow();
    const email = await kdb
      .insertInto('ccrt_demand_emails')
      .values({
        author_id: testUsers.ccrt.id,
        body: 'Message conservé',
        cc: '',
        demand_id: demand.id,
        id: uuid(800),
        object: 'Prise de contact',
        reply_to: testUsers.ccrt.email,
        sent_at: new Date(),
        signature: '',
        status: 'sent',
        to: demand.email,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    const route = createTestCaller(testUsers.admin).batEnr.admin;
    const context = (await route.listDemandesChaleurRenouvelable()).items[0];
    expect(context.last_ccrt_status_change).toStrictEqual(null);
    await route.reopenDemand({ demandId: demand.id, updatedAt: context.updated_at });
    const ccrt = createTestCaller(testUsers.ccrt).batEnr.ccrt;
    expect((await ccrt.listDemandesChaleurRenouvelable()).items).toStrictEqual([]);
    await expect(ccrt.getFollowUp({ demandId: demand.id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      ccrt.updateDemandeChaleurRenouvelable({ demandId: demand.id, values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS } })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await route.validateDemandeChaleurRenouvelable({ demandId: demand.id });
    expect(
      (await ccrt.listDemandesChaleurRenouvelable()).items.map(({ id, assigned_to, status }) => ({ assigned_to, id, status }))
    ).toStrictEqual([{ assigned_to: testUsers.ccrt.id, id: demand.id, status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT }]);
    expect(await kdb.selectFrom('ccrt_demand_notes').selectAll().execute()).toStrictEqual([note]);
    expect(await kdb.selectFrom('ccrt_demand_emails').selectAll().execute()).toStrictEqual([email]);
    expect(
      await kdb.selectFrom('demands_chaleur_renouvelable').select(['notified_at', 'reopened_at']).executeTakeFirstOrThrow()
    ).toStrictEqual({ notified_at: demand.notified_at, reopened_at: expect.any(Date) });
    expect((await route.listDemandesChaleurRenouvelable()).items.map(({ id, validated }) => ({ id, validated }))).toStrictEqual([
      { id: demand.id, validated: true },
    ]);
    expect(await kdb.selectFrom('events').select(['type', 'data']).where('type', '=', 'ccrt_demand_moderated').execute()).toStrictEqual([
      { data: { action: 'reopen' }, type: 'ccrt_demand_moderated' },
    ]);
    expect(await kdb.selectFrom('jobs').select('id').execute()).toStrictEqual([]);
    expect(sendEmailTemplate).not.toHaveBeenCalled();
  });

  it('rejects confirmation if the CCRT follow-up changed after the context was read', async () => {
    const demand = await seedDemandeChaleurRenouvelable({
      departement_code: '75',
      updated_at: new Date('2026-11-05T10:00:00.000Z'),
      validated: true,
    });
    const route = createTestCaller(testUsers.admin).batEnr.admin;
    const context = (await route.listDemandesChaleurRenouvelable()).items[0];
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({
      demandId: demand.id,
      values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT },
    });
    await expect(route.reopenDemand({ demandId: demand.id, updatedAt: context.updated_at })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(
      await kdb.selectFrom('demands_chaleur_renouvelable').select(['status', 'validated', 'reopened_at']).executeTakeFirstOrThrow()
    ).toStrictEqual({ reopened_at: null, status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT, validated: true });
  });

  it('allows only one concurrent reopening and rejects unpublished or archived demands', async () => {
    const demand = await seedDemandeChaleurRenouvelable({ validated: true });
    const route = createTestCaller(testUsers.admin).batEnr.admin;
    const input = { demandId: demand.id, updatedAt: demand.updated_at.toISOString() };
    const results = await Promise.allSettled([route.reopenDemand(input), route.reopenDemand(input)]);
    expect(results.map((result) => result.status).toSorted()).toStrictEqual(['fulfilled', 'rejected']);
    await expect(route.reopenDemand(input)).rejects.toMatchObject({ code: 'CONFLICT' });
    await route.archiveDemand({ demandId: demand.id, reason: 'duplicate', sendEmail: false });
    await expect(route.reopenDemand(input)).rejects.toMatchObject({ code: 'CONFLICT' });
    await route.restoreDemand({ demandId: demand.id });
    await route.validateDemandeChaleurRenouvelable({ demandId: demand.id });
    expect(
      await kdb.selectFrom('demands_chaleur_renouvelable').select(['validated', 'archive_reason', 'reopened_at']).executeTakeFirstOrThrow()
    ).toStrictEqual({ archive_reason: null, reopened_at: expect.any(Date), validated: true });
  });

  it('rolls back withdrawal if recording its audit fails', async () => {
    const demand = await seedDemandeChaleurRenouvelable({ validated: true });
    vi.spyOn(eventsService, 'createUserEvent').mockRejectedValueOnce(new Error('Audit unavailable'));
    await expect(
      createTestCaller(testUsers.admin).batEnr.admin.reopenDemand({ demandId: demand.id, updatedAt: demand.updated_at.toISOString() })
    ).rejects.toThrow('Audit unavailable');
    expect(
      await kdb.selectFrom('demands_chaleur_renouvelable').select(['validated', 'reopened_at']).executeTakeFirstOrThrow()
    ).toStrictEqual({ reopened_at: null, validated: true });
  });
});
