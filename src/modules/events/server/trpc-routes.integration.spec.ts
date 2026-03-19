import type { Insertable } from 'kysely';
import type { User } from 'next-auth';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import type { Events } from '@/server/db/kysely/database';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import type { TestCaseBoolean } from '@/tests/trpc-helpers';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

const adminOnlyPermissions: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.professionnel },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: true, input: testUsers.admin },
];

function testPermissions(
  permissions: TestCaseBoolean<Partial<User> | null>[],
  callRoute: (user: Partial<User> | null) => () => Promise<unknown>
) {
  permissions.forEach(({ input: user, expectedOutput: allowed }) => {
    it(`${allowed ? 'autorise' : 'refuse'} ${user?.role ?? 'non authentifié'}`, async () => {
      if (allowed) {
        await expect(callRoute(user)()).resolves.toBeDefined();
      } else {
        await expect(callRoute(user)).rejects.toMatchObject(forbiddenError);
      }
    });
  });
}

const authorId = uuid(200);
const authorEmail = `author-${authorId}@test.local`;

// Date helpers
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

type SeedEvent = Pick<Insertable<Events>, 'type' | 'context_type' | 'context_id' | 'author_id' | 'data' | 'created_at'>;

async function seedEvents(events: SeedEvent[]) {
  await Promise.all(
    events.map((event) =>
      kdb
        .insertInto('events')
        .values({
          author_id: event.author_id ?? null,
          context_id: event.context_id,
          context_type: event.context_type,
          created_at: event.created_at ?? now,
          data: JSON.stringify(event.data ?? {}),
          type: event.type,
        })
        .execute()
    )
  );
}

describe('eventsRouter', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedTableUser([{ email: authorEmail, id: authorId, role: 'admin' }]);
  });

  beforeEach(async () => {
    await kdb.deleteFrom('events').execute();
  });

  describe('events.admin.list', () => {
    describe('permissions', () => {
      testPermissions(adminOnlyPermissions, (user) => () => createTestCaller(user).events.admin.list({ cursor: 0, limit: 50 }));
    });

    it('retourne les événements avec les informations auteur', async () => {
      await seedEvents([{ author_id: authorId, context_id: 'demand-1', context_type: 'demand', type: 'demand_created' }]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.list({ cursor: 0, limit: 50 });

      expect(result.total).toStrictEqual(1);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        author: { email: authorEmail, id: authorId, role: 'admin' },
        author_id: authorId,
        context_id: 'demand-1',
        context_type: 'demand',
        type: 'demand_created',
      });
    });

    it('retourne les événements système sans auteur', async () => {
      await seedEvents([{ context_id: 'sync-1', context_type: 'system', data: { name: 'test' }, type: 'build_tiles' }]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.list({ cursor: 0, limit: 50 });

      expect(result.events[0]).toMatchObject({
        author: null,
        author_id: null,
        type: 'build_tiles',
      });
    });

    it('filtre par type', async () => {
      await seedEvents([
        { context_id: 'd1', context_type: 'demand', type: 'demand_created' },
        { context_id: 'u1', context_type: 'user', type: 'user_login' },
      ]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.list({ cursor: 0, limit: 50, types: ['demand_created'] });

      expect(result.total).toStrictEqual(1);
      expect(result.events[0]).toMatchObject({ type: 'demand_created' });
    });

    it('filtre par authorIds', async () => {
      await seedEvents([
        { author_id: authorId, context_id: 'd1', context_type: 'demand', type: 'demand_created' },
        { context_id: 'd2', context_type: 'demand', type: 'demand_created' },
      ]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.list({ authorIds: [authorId], cursor: 0, limit: 50 });

      expect(result.total).toStrictEqual(1);
      expect(result.events[0]).toMatchObject({ author_id: authorId });
    });

    it('filtre par context', async () => {
      await seedEvents([
        { context_id: 'demand-1', context_type: 'demand', type: 'demand_created' },
        { context_id: 'demand-2', context_type: 'demand', type: 'demand_updated' },
      ]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.list({ contextId: 'demand-1', contextType: 'demand', cursor: 0, limit: 50 });

      expect(result.total).toStrictEqual(1);
      expect(result.events[0]).toMatchObject({ context_id: 'demand-1' });
    });

    it('filtre par plage de dates', async () => {
      await seedEvents([
        { context_id: 'd1', context_type: 'demand', created_at: daysAgo(10), type: 'demand_created' },
        { context_id: 'd2', context_type: 'demand', created_at: daysAgo(5), type: 'demand_updated' },
        { context_id: 'd3', context_type: 'demand', created_at: daysAgo(1), type: 'demand_deleted' },
      ]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.list({ cursor: 0, dateFrom: daysAgo(7), dateTo: daysAgo(3), limit: 50 });

      expect(result.total).toStrictEqual(1);
      expect(result.events[0]).toMatchObject({ type: 'demand_updated' });
    });

    it('pagine avec cursor et limit', async () => {
      await seedEvents([
        { context_id: 'd1', context_type: 'demand', created_at: daysAgo(3), type: 'demand_created' },
        { context_id: 'd2', context_type: 'demand', created_at: daysAgo(2), type: 'demand_updated' },
        { context_id: 'd3', context_type: 'demand', created_at: daysAgo(1), type: 'demand_deleted' },
      ]);

      const caller = createTestCaller(testUsers.admin);

      const page1 = await caller.events.admin.list({ cursor: 0, limit: 2 });
      expect(page1.total).toStrictEqual(3);
      expect(page1.events).toHaveLength(2);
      // Tri DESC par created_at
      expect(page1.events[0]).toMatchObject({ type: 'demand_deleted' });
      expect(page1.events[1]).toMatchObject({ type: 'demand_updated' });

      const page2 = await caller.events.admin.list({ cursor: 2, limit: 2 });
      expect(page2.total).toStrictEqual(3);
      expect(page2.events).toHaveLength(1);
      expect(page2.events[0]).toMatchObject({ type: 'demand_created' });
    });
  });

  describe('events.admin.getStats', () => {
    const baseStatsInput = {
      dateFrom: daysAgo(30),
      dateTo: now,
      granularity: 'day' as const,
    };

    describe('permissions', () => {
      testPermissions(adminOnlyPermissions, (user) => () => createTestCaller(user).events.admin.getStats(baseStatsInput));
    });

    it('retourne les statistiques avec time series et distribution', async () => {
      await seedEvents([
        { context_id: 'd1', context_type: 'demand', created_at: daysAgo(5), type: 'demand_created' },
        { context_id: 'd2', context_type: 'demand', created_at: daysAgo(5), type: 'demand_created' },
        { context_id: 'u1', context_type: 'user', created_at: daysAgo(3), type: 'user_login' },
      ]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.getStats(baseStatsInput);

      expect(result.total).toStrictEqual(3);
      expect(result.timeSeries).toHaveLength(2); // 2 jours distincts
      expect(result.typeDistribution).toStrictEqual([
        { count: 2, type: 'demand_created' },
        { count: 1, type: 'user_login' },
      ]);
    });

    it('filtre par types', async () => {
      await seedEvents([
        { context_id: 'd1', context_type: 'demand', created_at: daysAgo(2), type: 'demand_created' },
        { context_id: 'u1', context_type: 'user', created_at: daysAgo(2), type: 'user_login' },
      ]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.getStats({ ...baseStatsInput, types: ['user_login'] });

      expect(result.total).toStrictEqual(1);
      expect(result.typeDistribution).toStrictEqual([{ count: 1, type: 'user_login' }]);
    });

    it('filtre par authorIds', async () => {
      await seedEvents([
        { author_id: authorId, context_id: 'd1', context_type: 'demand', created_at: daysAgo(2), type: 'demand_created' },
        { context_id: 'd2', context_type: 'demand', created_at: daysAgo(2), type: 'demand_created' },
      ]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.getStats({ ...baseStatsInput, authorIds: [authorId] });

      expect(result.total).toStrictEqual(1);
    });

    it('filtre par context', async () => {
      await seedEvents([
        { context_id: 'demand-1', context_type: 'demand', created_at: daysAgo(2), type: 'demand_created' },
        { context_id: 'demand-2', context_type: 'demand', created_at: daysAgo(2), type: 'demand_updated' },
      ]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.getStats({ ...baseStatsInput, contextId: 'demand-1', contextType: 'demand' });

      expect(result.total).toStrictEqual(1);
    });

    it('exclut les événements hors plage de dates', async () => {
      await seedEvents([
        { context_id: 'd1', context_type: 'demand', created_at: daysAgo(60), type: 'demand_created' },
        { context_id: 'd2', context_type: 'demand', created_at: daysAgo(5), type: 'demand_updated' },
      ]);

      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.getStats(baseStatsInput);

      expect(result.total).toStrictEqual(1);
      expect(result.typeDistribution).toStrictEqual([{ count: 1, type: 'demand_updated' }]);
    });
  });

  describe('events.admin.searchAuthors', () => {
    describe('permissions', () => {
      testPermissions(adminOnlyPermissions, (user) => () => createTestCaller(user).events.admin.searchAuthors({ search: 'test' }));
    });

    it("trouve un utilisateur par fragment d'email", async () => {
      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.searchAuthors({ search: 'author' });

      expect(result).toStrictEqual([{ email: authorEmail, id: authorId, role: 'admin' }]);
    });

    it('retourne un tableau vide si aucune correspondance', async () => {
      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.searchAuthors({ search: 'zzz-inexistant' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('events.admin.getAuthorsByIds', () => {
    describe('permissions', () => {
      testPermissions(adminOnlyPermissions, (user) => () => createTestCaller(user).events.admin.getAuthorsByIds({ ids: [] }));
    });

    it('retourne les auteurs par IDs', async () => {
      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.getAuthorsByIds({ ids: [authorId] });

      expect(result).toStrictEqual([{ email: authorEmail, id: authorId, role: 'admin' }]);
    });

    it("retourne un tableau vide pour un tableau d'IDs vide", async () => {
      const caller = createTestCaller(testUsers.admin);
      const result = await caller.events.admin.getAuthorsByIds({ ids: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
