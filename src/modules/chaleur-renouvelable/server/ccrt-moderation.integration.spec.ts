import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmailTemplate } from '@/modules/email';
import * as eventsService from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { cleanDatabase, seedDemandeChaleurRenouvelable, seedReseauDeChaleur, seedTableUser } from '@/tests/fixtures';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';
import { fetchJSON } from '@/utils/network';

import { processCcrtModerationEmail } from './ccrt-moderation-email';

vi.mock('@/modules/email', () => ({ sendEmailTemplate: vi.fn() }));
vi.mock('@/utils/network', () => ({ fetchJSON: vi.fn(), postFetchJSON: vi.fn() }));
vi.mock('./france-renov-directory', () => ({ getNearestFranceRenovSpace: vi.fn().mockResolvedValue(null) }));
afterEach(() => vi.restoreAllMocks());

const banAddress = {
  geometry: { coordinates: [2.3522, 48.8566] },
  properties: { city: 'Paris', citycode: '75056', postcode: '75001' },
};

beforeEach(async () => {
  await cleanDatabase();
  vi.clearAllMocks();
  vi.mocked(sendEmailTemplate).mockResolvedValue(undefined);
  vi.mocked(fetchJSON).mockResolvedValue({ features: [banAddress] });
  await seedTableUser(Object.values(testUsers));
  await kdb
    .insertInto('user_permissions')
    .values([
      { resource_id: '75', type: 'departement', user_id: testUsers.ccrt.id },
      { resource_id: '75', type: 'departement', user_id: testUsers.alec.id },
      { resource_id: '500', type: 'reseau_de_chaleur', user_id: testUsers.gestionnaire.id },
    ])
    .execute();
});

const seedNetwork = (id_fcu = 500, offset = 0) =>
  seedReseauDeChaleur({
    Gestionnaire: 'Gestionnaire test',
    geom: sql`ST_Transform(ST_GeomFromText(${`LINESTRING(${2.3522 + offset} 48.8566, ${2.3532 + offset} 48.8566)`}, 4326), 2154)`,
    has_trace: true,
    'Identifiant reseau': `${id_fcu}C`,
    id_fcu,
    nom_reseau: `Réseau ${id_fcu}`,
    ouvert_aux_raccordements: true,
  });

describe('Admin moderation permissions', () => {
  const cases: TestCaseBoolean<(typeof testUsers)[keyof typeof testUsers] | null>[] = [
    { expectedOutput: false, input: null },
    ...Object.values(testUsers).map((user) => ({ expectedOutput: user.role === 'admin', input: user })),
  ];
  cases.forEach(({ input: user, expectedOutput: allowed }) => {
    it(`protects moderation and private comments for ${user?.role ?? 'anonymous'}`, async () => {
      const demand = await seedDemandeChaleurRenouvelable();
      await seedNetwork();
      const route = createTestCaller(user).batEnr.admin;
      const operations = [
        () => route.getAdminComment({ demandId: demand.id }),
        () => route.updateAdminComment({ comment: 'Private', demandId: demand.id }),
        () => route.getTransferNetwork({ demandId: demand.id }),
        () => route.archiveDemand({ demandId: demand.id, reason: 'test', sendEmail: false }),
        () => route.restoreDemand({ demandId: demand.id }),
        () => route.transferDemand({ demandId: demand.id, networkId: 500 }),
      ];
      await operations.reduce(async (previous, operation) => {
        await previous;
        if (allowed) {
          await expect(operation()).resolves.toEqual(expect.any(Object));
        } else {
          await expect(operation()).rejects.toMatchObject(forbiddenError);
        }
      }, Promise.resolve());
    });
  });
});

describe('CCRT moderation lifecycle', () => {
  it('rolls back a transfer completely when its classic-demand audit cannot be recorded', async () => {
    const demand = await seedDemandeChaleurRenouvelable();
    await seedNetwork();
    vi.spyOn(eventsService, 'createUserEvent').mockRejectedValueOnce(new Error('Audit unavailable'));
    await expect(createTestCaller(testUsers.admin).batEnr.admin.transferDemand({ demandId: demand.id, networkId: 500 })).rejects.toThrow(
      'Audit unavailable'
    );
    expect(await kdb.selectFrom('demands').select('id').execute()).toStrictEqual([]);
    expect(await kdb.selectFrom('jobs').select('id').execute()).toStrictEqual([]);
    expect(
      await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['archived_at', 'transferred_demand_id', 'validated'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow()
    ).toStrictEqual({ archived_at: null, transferred_demand_id: null, validated: false });
  });

  it('serializes validation and archival of the same demand', async () => {
    const demand = await seedDemandeChaleurRenouvelable();
    const route = createTestCaller(testUsers.admin).batEnr.admin;
    const results = await Promise.allSettled([
      route.validateDemandeChaleurRenouvelable({ demandId: demand.id }),
      route.archiveDemand({ demandId: demand.id, reason: 'test', sendEmail: false }),
    ]);
    expect(results.map((result) => result.status).toSorted()).toStrictEqual(['fulfilled', 'rejected']);
  });

  it('refuses to replay a delivery with an uncertain SMTP outcome', async () => {
    const demand = await seedDemandeChaleurRenouvelable();
    await createTestCaller(testUsers.admin).batEnr.admin.archiveDemand({ demandId: demand.id, reason: 'test' });
    const job = await kdb.selectFrom('jobs').select(['id', 'data']).executeTakeFirstOrThrow();
    await kdb
      .updateTable('jobs')
      .set({ data: sql`jsonb_set(${JSON.stringify(job.data)}::jsonb, '{deliveryStatus}', '"sending"')` })
      .where('id', '=', job.id)
      .execute();
    await expect(processCcrtModerationEmail(job, parentLogger)).rejects.toThrow('Envoi déjà réservé');
    expect(sendEmailTemplate).not.toHaveBeenCalled();
  });
  it.each([true, false])('archives with optional user email (%s), excludes CCRT and restores without email', async (sendEmail) => {
    const demand = await seedDemandeChaleurRenouvelable({ departement_code: '75' });
    const route = createTestCaller(testUsers.admin).batEnr.admin;
    await route.archiveDemand({ comment: 'Duplicate', demandId: demand.id, reason: 'other', sendEmail });
    const archived = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(['archived_at', 'archive_reason', 'archive_comment', 'validated'])
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect(archived).toStrictEqual({
      archive_comment: 'Duplicate',
      archive_reason: 'other',
      archived_at: expect.any(Date),
      validated: false,
    });
    expect((await createTestCaller(testUsers.ccrt).batEnr.ccrt.listDemandesChaleurRenouvelable()).items).toStrictEqual([]);
    await expect(route.validateDemandeChaleurRenouvelable({ demandId: demand.id })).rejects.toMatchObject({ code: 'CONFLICT' });
    const jobs = await kdb.selectFrom('jobs').select('id').execute();
    expect(jobs.length).toStrictEqual(sendEmail ? 1 : 0);
    await route.restoreDemand({ demandId: demand.id });
    expect(
      await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['archived_at', 'archive_reason', 'archive_comment', 'validated'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow()
    ).toStrictEqual({ archive_comment: null, archive_reason: null, archived_at: null, validated: false });
    if (jobs[0]) {
      expect(await processCcrtModerationEmail(jobs[0], parentLogger)).toStrictEqual({ skipped: true });
    }
    expect(sendEmailTemplate).not.toHaveBeenCalled();
  });

  it('creates one validated connection demand, retains private details and prevents restoring a transfer', async () => {
    const demand = await seedDemandeChaleurRenouvelable({
      admin_comment: 'Private admin',
      comments: 'Public comment',
      departement_code: '75',
      refusal_reason: 'Additional context',
    });
    await seedNetwork();
    const route = createTestCaller(testUsers.admin).batEnr.admin;
    const result = await route.transferDemand({ demandId: demand.id, networkId: 500 });
    const classic = await kdb
      .selectFrom('demands')
      .select(['network_id', 'network_type', 'validated', 'comment_user', 'comment_fcu', 'legacy_values'])
      .where('id', '=', result.transferredDemandId)
      .executeTakeFirstOrThrow();
    expect(classic).toMatchObject({
      comment_fcu: null,
      comment_user: 'Public comment',
      legacy_values: { 'Distance au réseau': 0, Mail: demand.email, 'Nom réseau': 'Réseau 500', Status: 'À traiter' },
      network_id: 500,
      network_type: 'reseau_de_chaleur',
      validated: true,
    });
    expect(JSON.stringify(classic)).not.toContain('Private admin');
    expect(JSON.stringify(classic)).not.toContain('Additional context');
    expect(
      await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['admin_comment', 'refusal_reason', 'transferred_demand_id', 'transferred_network_name', 'validated'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow()
    ).toStrictEqual({
      admin_comment: 'Private admin',
      refusal_reason: 'Additional context',
      transferred_demand_id: result.transferredDemandId,
      transferred_network_name: 'Réseau 500',
      validated: false,
    });
    const managerDemands = await createTestCaller(testUsers.gestionnaire).demands.gestionnaire.list();
    expect(managerDemands.map((item) => item.id)).toStrictEqual([result.transferredDemandId]);
    await expect(route.restoreDemand({ demandId: demand.id })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(route.transferDemand({ demandId: demand.id, networkId: 500 })).rejects.toMatchObject({ code: 'CONFLICT' });
    const job = await kdb.selectFrom('jobs').select('id').executeTakeFirstOrThrow();
    await processCcrtModerationEmail(job, parentLogger);
    await processCcrtModerationEmail(job, parentLogger);
    expect(sendEmailTemplate).toHaveBeenCalledExactlyOnceWith(
      'demands.demandeur.transfert-chaleur-renouvelable',
      { email: demand.email },
      {
        demand: expect.objectContaining({ address: demand.address }),
        network: { distance: 0, manager: 'Gestionnaire test', name: 'Réseau 500' },
      }
    );
  });

  it('serializes concurrent archive and transfer operations', async () => {
    const demand = await seedDemandeChaleurRenouvelable();
    await seedNetwork();
    const route = createTestCaller(testUsers.admin).batEnr.admin;
    const outcomes = await Promise.allSettled([
      route.transferDemand({ demandId: demand.id, networkId: 500 }),
      route.archiveDemand({ demandId: demand.id, reason: 'test', sendEmail: false }),
    ]);
    expect(outcomes.map((outcome) => outcome.status).toSorted()).toStrictEqual(['fulfilled', 'rejected']);
    const source = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select('transferred_demand_id')
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect((await kdb.selectFrom('demands').select('id').execute()).length).toStrictEqual(source.transferred_demand_id ? 1 : 0);
  });

  it('chooses the closest traced network and accepts an explicit alternative', async () => {
    const demand = await seedDemandeChaleurRenouvelable();
    await seedNetwork(500);
    await seedNetwork(501, 0.01);
    const route = createTestCaller(testUsers.admin).batEnr.admin;
    expect((await route.getTransferNetwork({ demandId: demand.id })).network).toMatchObject({ distance: 0, id_fcu: 500, sncu_id: '500C' });
    expect((await route.getTransferNetwork({ demandId: demand.id, networkId: 501 })).network).toMatchObject({
      distance: expect.any(Number),
      id_fcu: 501,
    });
  });

  it('never includes admin comments in shared lists, follow-up notes, history or audit data', async () => {
    const demand = await seedDemandeChaleurRenouvelable({ departement_code: '75', validated: true });
    await createTestCaller(testUsers.admin).batEnr.admin.updateAdminComment({ comment: 'Secret text', demandId: demand.id });
    const ccrt = createTestCaller(testUsers.ccrt).batEnr.ccrt;
    const list = await ccrt.listDemandesChaleurRenouvelable();
    const followUp = await ccrt.getFollowUp({ demandId: demand.id });
    const events = await kdb.selectFrom('events').select('data').execute();
    expect(JSON.stringify([list, followUp, events])).not.toContain('Secret text');
    expect(followUp.history).toStrictEqual([]);
    expect(await createTestCaller(testUsers.admin).batEnr.admin.getAdminComment({ demandId: demand.id })).toStrictEqual({
      admin_comment: 'Secret text',
    });
  });

  it('counts each active CCRT account once before validation and exposes its last connection to admins', async () => {
    const demand = await seedDemandeChaleurRenouvelable({ commune_code: '75056', departement_code: '75' });
    await kdb
      .updateTable('users')
      .set({ last_connection: new Date('2026-10-23T10:00:00Z') })
      .where('id', '=', testUsers.ccrt.id)
      .execute();
    await kdb.insertInto('user_permissions').values({ resource_id: '75056', type: 'commune', user_id: testUsers.ccrt.id }).execute();
    const admin = createTestCaller(testUsers.admin).batEnr;
    const list = await admin.admin.listDemandesChaleurRenouvelable();
    expect(list.items[0].access_users).toMatchObject([{ id: testUsers.ccrt.id, last_connection: expect.any(String), role: 'ccrt' }]);
    expect((await admin.ccrt.getFollowUp({ demandId: demand.id })).users).toStrictEqual(list.items[0].access_users);
  });

  it('delivers an archive notice with fallback advice and keeps failed SMTP retryable', async () => {
    const demand = await seedDemandeChaleurRenouvelable();
    await createTestCaller(testUsers.admin).batEnr.admin.archiveDemand({ demandId: demand.id, reason: 'individual_house' });
    const job = await kdb.selectFrom('jobs').select('id').executeTakeFirstOrThrow();
    vi.mocked(sendEmailTemplate).mockRejectedValueOnce(new Error('SMTP unavailable'));
    await expect(processCcrtModerationEmail(job, parentLogger)).rejects.toThrow('SMTP unavailable');
    await processCcrtModerationEmail(job, parentLogger);
    expect(sendEmailTemplate).toHaveBeenLastCalledWith(
      'demands.demandeur.archivage-chaleur-renouvelable',
      { email: demand.email },
      { demand: expect.objectContaining({ address: demand.address }), space: null }
    );
  });
});
