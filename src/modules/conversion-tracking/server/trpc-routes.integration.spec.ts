import type { User } from 'next-auth';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { appRouter } from '@/modules/trpc/trpc.config';
import { type ConversionEvents, type Insertable, kdb, sql } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import type { TestCaseBoolean } from '@/tests/trpc-helpers';
import { createMockContext, createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';
import { formatAsISODate } from '@/utils/date';

import type { ConversionStatRow, SuspiciousIpRow } from './service';

const adminOnlyPermissions: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
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

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

type ConversionEventSeed = Omit<Insertable<ConversionEvents>, 'route' | 'page'> & { route?: string; page?: string };

/** Seed direct d'events ; `route`/`page` (posés par le client en prod) valent `/page` par défaut. */
const seedEvents = (events: ConversionEventSeed[]) =>
  kdb
    .insertInto('conversion_events')
    .values(events.map((event) => ({ page: '/page', route: '/page', ...event })))
    .execute();

/** Ligne de stats attendue, complète (défauts à zéro) — à utiliser avec `toStrictEqual`. */
const statRow = (row: Partial<ConversionStatRow> & Pick<ConversionStatRow, 'channel' | 'label'>): ConversionStatRow => ({
  demandRate: null,
  demands: 0,
  demandsEligible: 0,
  displays: 0,
  distinctIp: 0,
  host: null,
  page: null,
  period: null,
  route: null,
  source: null,
  sourceCreatedAt: null,
  testRate: null,
  tests: 0,
  testsEligible: 0,
  testsNotEligible: 0,
  unregistered: false,
  ...row,
});

/** Ligne de suspect attendue, complète (défauts) — `firstSeen`/`lastSeen` = échos du seed, non asservis. */
const suspiciousRow = (row: Partial<SuspiciousIpRow> & Pick<SuspiciousIpRow, 'ip'>): SuspiciousIpRow => ({
  demands: 0,
  displays: 0,
  distinctDays: 1,
  distinctRoutes: 1,
  events: 0,
  firstSeen: expect.any(String),
  hasExactRule: false,
  lastSeen: expect.any(String),
  ruleDisposition: null,
  ruleIp: null,
  ruleReason: null,
  testPerDisplay: null,
  tests: 0,
  ...row,
});

/** Les `ip::text` des events actuellement exclus (triées), pour vérifier la réconciliation du flag. */
const excludedEventIps = () =>
  kdb
    .selectFrom('conversion_events')
    .select((eb) => sql<string>`${eb.ref('ip')}::text`.as('ip'))
    .where('excluded', '=', true)
    .orderBy('ip')
    .execute()
    .then((rows) => rows.map((r) => r.ip));

describe('conversionTrackingRouter', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedTableUser([{ email: testUsers.admin.email, id: testUsers.admin.id, role: 'admin' }]);
  });

  beforeEach(async () => {
    await Promise.all([
      kdb.deleteFrom('conversion_events').execute(),
      kdb.deleteFrom('conversion_ip_rules').execute(),
      kdb.deleteFrom('conversion_sources').execute(),
      kdb.deleteFrom('demands').execute(),
      kdb.deleteFrom('events').execute(),
    ]);
  });

  describe('recordEvent (public)', () => {
    it('enregistre un affichage et capture IP', async () => {
      await createTestCaller(null).conversionTracking.recordEvent({
        page: '/iframe/carte',
        route: '/iframe/carte',
        source: 'iframe-test',
        type: 'display',
      });

      const rows = await kdb.selectFrom('conversion_events').selectAll().execute();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        eligible: null,
        host: null,
        ip: '127.0.0.1',
        page: '/iframe/carte',
        route: '/iframe/carte',
        source: 'iframe-test',
        type: 'display',
      });
    });

    it("enregistre un test d'adresse avec le résultat d'éligibilité et la page hôte", async () => {
      await createTestCaller(null).conversionTracking.recordEvent({
        eligible: true,
        host: 'mairie-test.fr/chauffage',
        page: '/iframe/carte',
        route: '/iframe/carte',
        source: 'iframe-test',
        type: 'address_test',
      });

      const row = await kdb.selectFrom('conversion_events').selectAll().executeTakeFirstOrThrow();
      expect(row).toMatchObject({ eligible: true, host: 'mairie-test.fr/chauffage', type: 'address_test' });
    });

    it('accepte un event sans source (page interne, iframe sans source)', async () => {
      await createTestCaller(null).conversionTracking.recordEvent({ page: '/villes/paris', route: '/villes/[ville]', type: 'display' });

      const row = await kdb.selectFrom('conversion_events').selectAll().executeTakeFirstOrThrow();
      expect(row).toMatchObject({ route: '/villes/[ville]', source: null });
    });

    it("ignore les bots (isbot) sans enregistrer d'event", async () => {
      const botCaller = appRouter.createCaller({
        ...createMockContext(null),
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      });

      await botCaller.conversionTracking.recordEvent({ page: '/villes/paris', route: '/villes/[ville]', type: 'display' });

      const rows = await kdb.selectFrom('conversion_events').selectAll().execute();
      expect(rows).toHaveLength(0);
    });
  });

  describe('sources (admin)', () => {
    describe('permissions', () => {
      testPermissions(
        adminOnlyPermissions,
        (user) => () => createTestCaller(user).conversionTracking.sources.list({ includeArchived: false })
      );
    });

    it('crée, liste, met à jour puis archive une source', async () => {
      const caller = createTestCaller(testUsers.admin);

      const created = await caller.conversionTracking.sources.create({ label: 'Iframe A' });
      expect(created).toMatchObject({ label: 'Iframe A' });

      const updated = await caller.conversionTracking.sources.update({ id: created.id, label: 'Iframe A bis' });
      expect(updated.label).toStrictEqual('Iframe A bis');

      await caller.conversionTracking.sources.archive({ id: created.id });
      const [active, archived] = await Promise.all([
        caller.conversionTracking.sources.list({ includeArchived: false }),
        caller.conversionTracking.sources.list({ includeArchived: true }),
      ]);
      expect(active).toHaveLength(0);
      expect(archived).toHaveLength(1);

      // Chaque mutation a émis son event d'audit.
      const auditEvents = await kdb
        .selectFrom('events')
        .select(['author_id', 'context_id', 'context_type', 'data', 'type'])
        .orderBy('created_at', 'asc')
        .execute();
      expect(auditEvents).toStrictEqual([
        {
          author_id: testUsers.admin.id,
          context_id: created.id,
          context_type: 'conversion_source',
          data: { label: 'Iframe A' },
          type: 'conversion_source_created',
        },
        {
          author_id: testUsers.admin.id,
          context_id: created.id,
          context_type: 'conversion_source',
          data: { label: 'Iframe A bis' },
          type: 'conversion_source_updated',
        },
        {
          author_id: testUsers.admin.id,
          context_id: created.id,
          context_type: 'conversion_source',
          data: { label: 'Iframe A bis' },
          type: 'conversion_source_archived',
        },
      ]);
    });
  });

  describe('getStats (admin)', () => {
    const baseStatsInput = { dateFrom: daysAgo(30), dateTo: now, granularity: 'day' as const };

    describe('permissions', () => {
      testPermissions(adminOnlyPermissions, (user) => () => createTestCaller(user).conversionTracking.getStats(baseStatsInput));
    });

    it('agrège le funnel par source (affichages, tests éligibles/non, demandes, distinct-IP)', async () => {
      const source = await kdb
        .insertInto('conversion_sources')
        .values({ label: 'Iframe A' })
        .returning(['id', 'created_at'])
        .executeTakeFirstOrThrow();
      await seedEvents([
        { created_at: daysAgo(2), ip: '1.1.1.1', source: source.id, type: 'display' },
        { created_at: daysAgo(2), ip: '1.1.1.1', source: source.id, type: 'display' },
        { created_at: daysAgo(2), ip: '2.2.2.2', source: source.id, type: 'display' },
        { created_at: daysAgo(2), eligible: true, ip: '1.1.1.1', source: source.id, type: 'address_test' },
        { created_at: daysAgo(2), eligible: false, ip: '1.1.1.1', source: source.id, type: 'address_test' },
        { created_at: daysAgo(2), eligible: true, source: source.id, type: 'demand' },
      ]);

      const result = await createTestCaller(testUsers.admin).conversionTracking.getStats(baseStatsInput);

      expect(result).toStrictEqual([
        statRow({
          channel: 'iframe',
          demandRate: 1 / 2,
          demands: 1,
          demandsEligible: 1,
          displays: 3,
          distinctIp: 2,
          label: 'Iframe A',
          period: formatAsISODate(daysAgo(2)),
          route: '/page',
          source: source.id,
          sourceCreatedAt: new Date(source.created_at).toISOString(),
          testRate: 2 / 3,
          tests: 2,
          testsEligible: 1,
          testsNotEligible: 1,
        }),
      ]);
    });

    it('agrège les pages internes par route (pattern), avec drill par page exacte (groupByPage)', async () => {
      await seedEvents([
        { created_at: daysAgo(2), page: '/villes/charleville', route: '/villes/[ville]', type: 'display' },
        { created_at: daysAgo(2), page: '/villes/charleville', route: '/villes/[ville]', type: 'address_test' },
        { created_at: daysAgo(2), page: '/villes/reims', route: '/villes/[ville]', type: 'display' },
      ]);

      const caller = createTestCaller(testUsers.admin);

      const byRoute = await caller.conversionTracking.getStats(baseStatsInput);
      expect(byRoute).toStrictEqual([
        statRow({
          channel: 'internal',
          demandRate: 0,
          displays: 2,
          label: '/villes/[ville]',
          period: formatAsISODate(daysAgo(2)),
          route: '/villes/[ville]',
          testRate: 1 / 2,
          tests: 1,
        }),
      ]);

      const byPage = await caller.conversionTracking.getStats({ ...baseStatsInput, groupByPage: true });
      expect(byPage).toStrictEqual([
        statRow({
          channel: 'internal',
          demandRate: 0,
          displays: 1,
          label: '/villes/[ville]',
          page: '/villes/charleville',
          period: formatAsISODate(daysAgo(2)),
          route: '/villes/[ville]',
          testRate: 1,
          tests: 1,
        }),
        statRow({
          channel: 'internal',
          displays: 1,
          label: '/villes/[ville]',
          page: '/villes/reims',
          period: formatAsISODate(daysAgo(2)),
          route: '/villes/[ville]',
          testRate: 0,
        }),
      ]);
    });

    it('ventile par site hôte (groupByHost) et classe une iframe sans source par sa route', async () => {
      await seedEvents([
        { created_at: daysAgo(2), host: 'engie.fr/a', route: '/iframe/carte', type: 'display' },
        { created_at: daysAgo(2), host: 'engie.fr/a', route: '/iframe/carte', type: 'address_test' },
        { created_at: daysAgo(2), host: 'engie.fr/b', route: '/iframe/carte', type: 'display' },
      ]);

      const result = await createTestCaller(testUsers.admin).conversionTracking.getStats({ ...baseStatsInput, groupByHost: true });

      expect(result).toStrictEqual([
        statRow({
          channel: 'iframe',
          demandRate: 0,
          displays: 1,
          host: 'engie.fr/a',
          label: '/iframe/carte',
          period: formatAsISODate(daysAgo(2)),
          route: '/iframe/carte',
          testRate: 1,
          tests: 1,
        }),
        statRow({
          channel: 'iframe',
          displays: 1,
          host: 'engie.fr/b',
          label: '/iframe/carte',
          period: formatAsISODate(daysAgo(2)),
          route: '/iframe/carte',
          testRate: 0,
        }),
      ]);
    });

    it('formate la période selon la granularité (jour → YYYY-MM-DD, mois → YYYY-MM)', async () => {
      await seedEvents([{ created_at: daysAgo(2), source: 'iframe-a', type: 'display' }]);

      const caller = createTestCaller(testUsers.admin);
      const [byDay] = await caller.conversionTracking.getStats(baseStatsInput);
      const [byMonth] = await caller.conversionTracking.getStats({ ...baseStatsInput, granularity: 'month' });

      expect(byDay.period).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(byMonth.period).toMatch(/^\d{4}-\d{2}$/);
    });

    it('filtre par canal (source présente ou route /iframe/* = iframe, sinon interne)', async () => {
      await seedEvents([
        { created_at: daysAgo(2), route: '/villes/[ville]', type: 'address_test' },
        { created_at: daysAgo(2), route: '/iframe/carte', type: 'display' },
      ]);

      const internal = await createTestCaller(testUsers.admin).conversionTracking.getStats({ ...baseStatsInput, channel: 'internal' });
      expect(internal).toStrictEqual([
        statRow({
          channel: 'internal',
          demandRate: 0,
          label: '/villes/[ville]',
          period: formatAsISODate(daysAgo(2)),
          route: '/villes/[ville]',
          tests: 1,
        }),
      ]);
    });

    it('signale les sources reçues absentes du registre (unregistered)', async () => {
      const connue = await kdb
        .insertInto('conversion_sources')
        .values({ label: 'Iframe connue' })
        .returning('id')
        .executeTakeFirstOrThrow();
      await seedEvents([
        { created_at: daysAgo(2), source: connue.id, type: 'display' },
        { created_at: daysAgo(2), source: 'iframe-inconnue', type: 'display' },
      ]);

      const result = await createTestCaller(testUsers.admin).conversionTracking.getStats(baseStatsInput);

      const unregisteredBySource = Object.fromEntries(result.filter((row) => row.source).map((row) => [row.source, row.unregistered]));
      expect(unregisteredBySource).toStrictEqual({ [connue.id]: false, 'iframe-inconnue': true });
    });

    it('affiche à zéro les intégrations actives muettes et les routes vues sur 12 mois (période nulle)', async () => {
      const caller = createTestCaller(testUsers.admin);
      const muette = await caller.conversionTracking.sources.create({ label: 'Iframe muette' });
      const archivee = await caller.conversionTracking.sources.create({ label: 'Iframe archivée' });
      await caller.conversionTracking.sources.archive({ id: archivee.id });
      // Route interne vue il y a 40 jours : hors période (30 j) mais dans la fenêtre de 12 mois.
      await seedEvents([{ created_at: daysAgo(40), route: '/villes/[ville]', type: 'display' }]);

      const result = await caller.conversionTracking.getStats(baseStatsInput);

      // L'intégration archivée n'apparaît pas ; les lignes à zéro ont une période nulle.
      expect(result).toStrictEqual([
        statRow({ channel: 'iframe', label: 'Iframe muette', source: muette.id, sourceCreatedAt: expect.any(String) }),
        statRow({ channel: 'internal', label: '/villes/[ville]', route: '/villes/[ville]' }),
      ]);
    });
  });

  describe('contrôle des abus / IP (admin)', () => {
    const statsInput = { dateFrom: daysAgo(30), dateTo: now, granularity: 'day' as const };
    const suspiciousInput = { dateFrom: daysAgo(30), dateTo: now, minTests: 2 };

    describe('permissions', () => {
      testPermissions(adminOnlyPermissions, (user) => () => createTestCaller(user).conversionTracking.getSuspiciousIps(suspiciousInput));
      testPermissions(adminOnlyPermissions, (user) => () => createTestCaller(user).conversionTracking.ipRules.list());
      testPermissions(
        adminOnlyPermissions,
        (user) => () => createTestCaller(user).conversionTracking.ipRules.upsert({ disposition: 'exclude', ip: '1.1.1.1', reason: 'x' })
      );
      testPermissions(adminOnlyPermissions, (user) => () => createTestCaller(user).conversionTracking.ipRules.remove({ ip: '1.1.1.1' }));
    });

    it('liste les IP suspectes au-dessus du seuil, triées par nb de tests, avec les signaux et sans règle', async () => {
      await seedEvents([
        { created_at: daysAgo(2), ip: '1.1.1.1', type: 'display' },
        { created_at: daysAgo(2), ip: '1.1.1.1', type: 'address_test' },
        { created_at: daysAgo(2), ip: '1.1.1.1', type: 'address_test' },
        { created_at: daysAgo(2), ip: '1.1.1.1', type: 'address_test' },
        { created_at: daysAgo(2), ip: '9.9.9.9', type: 'address_test' }, // 1 test < seuil (2)
      ]);

      const result = await createTestCaller(testUsers.admin).conversionTracking.getSuspiciousIps(suspiciousInput);

      expect(result).toStrictEqual([suspiciousRow({ displays: 1, events: 4, ip: '1.1.1.1', testPerDisplay: 3, tests: 3 })]);
    });

    it('bannir (exclude) retire les events de l’IP des stats et renvoie le nombre recompté', async () => {
      const caller = createTestCaller(testUsers.admin);
      await seedEvents([
        { created_at: daysAgo(2), ip: '1.1.1.1', type: 'address_test' },
        { created_at: daysAgo(2), ip: '1.1.1.1', type: 'address_test' },
        { created_at: daysAgo(2), ip: '2.2.2.2', type: 'address_test' },
      ]);

      const rule = await caller.conversionTracking.ipRules.upsert({ disposition: 'exclude', ip: '1.1.1.1', reason: 'bot' });
      expect(rule).toStrictEqual({ changedEvents: 2, disposition: 'exclude', ip: '1.1.1.1/32', reason: 'bot' });

      const [stats, suspects] = await Promise.all([
        caller.conversionTracking.getStats(statsInput),
        caller.conversionTracking.getSuspiciousIps({ ...suspiciousInput, minTests: 1 }),
      ]);
      // Seul le test de 2.2.2.2 reste compté dans les stats…
      expect(stats).toStrictEqual([
        statRow({
          channel: 'internal',
          demandRate: 0,
          distinctIp: 1,
          label: '/page',
          period: formatAsISODate(daysAgo(2)),
          route: '/page',
          tests: 1,
        }),
      ]);
      // …mais la détection montre toujours 1.1.1.1 avec sa disposition.
      expect(suspects).toStrictEqual([
        suspiciousRow({
          events: 2,
          hasExactRule: true,
          ip: '1.1.1.1',
          ruleDisposition: 'exclude',
          ruleIp: '1.1.1.1/32',
          ruleReason: 'bot',
          tests: 2,
        }),
        suspiciousRow({ events: 1, ip: '2.2.2.2', tests: 1 }),
      ]);
    });

    it('bannit une plage CIDR, et un keep plus spécifique l’emporte sur l’exclude', async () => {
      const caller = createTestCaller(testUsers.admin);
      await seedEvents([
        { created_at: daysAgo(2), ip: '10.0.0.5', type: 'address_test' },
        { created_at: daysAgo(2), ip: '10.0.0.99', type: 'address_test' },
      ]);

      await caller.conversionTracking.ipRules.upsert({ disposition: 'exclude', ip: '10.0.0.0/24', reason: 'plage' });
      expect(await excludedEventIps()).toStrictEqual(['10.0.0.5/32', '10.0.0.99/32']);

      await caller.conversionTracking.ipRules.upsert({ disposition: 'keep', ip: '10.0.0.5', reason: 'interne' });
      expect(await excludedEventIps()).toStrictEqual(['10.0.0.99/32']);

      // Détection : règle exacte (keep sur 10.0.0.5) vs héritée de la plage (exclude sur 10.0.0.99 via /24).
      const suspects = await caller.conversionTracking.getSuspiciousIps({ ...suspiciousInput, minTests: 1 });
      expect(suspects.sort((a, b) => a.ip.localeCompare(b.ip))).toStrictEqual([
        suspiciousRow({
          events: 1,
          hasExactRule: true,
          ip: '10.0.0.5',
          ruleDisposition: 'keep',
          ruleIp: '10.0.0.5/32',
          ruleReason: 'interne',
          tests: 1,
        }),
        suspiciousRow({
          events: 1,
          hasExactRule: false,
          ip: '10.0.0.99',
          ruleDisposition: 'exclude',
          ruleIp: '10.0.0.0/24',
          ruleReason: 'plage',
          tests: 1,
        }),
      ]);
    });

    it('une plage /24 exclut les IP comprises dedans sans toucher aux externes, et un keep /32 en réintègre une', async () => {
      const caller = createTestCaller(testUsers.admin);
      await seedEvents([
        { created_at: daysAgo(2), ip: '172.16.5.10', type: 'address_test' }, // dans 172.16.5.0/24
        { created_at: daysAgo(2), ip: '172.16.5.250', type: 'address_test' }, // dans 172.16.5.0/24
        { created_at: daysAgo(2), ip: '172.16.6.10', type: 'address_test' }, // hors : /24 voisin
        { created_at: daysAgo(2), ip: '8.8.8.8', type: 'address_test' }, // hors : autre bloc
      ]);

      const banned = await caller.conversionTracking.ipRules.upsert({ disposition: 'exclude', ip: '172.16.5.0/24', reason: 'plage' });
      expect(banned.changedEvents).toBe(2);
      expect(await excludedEventIps()).toStrictEqual(['172.16.5.10/32', '172.16.5.250/32']);

      const kept = await caller.conversionTracking.ipRules.upsert({ disposition: 'keep', ip: '172.16.5.10', reason: 'interne' });
      expect(kept.changedEvents).toBe(1);
      expect(await excludedEventIps()).toStrictEqual(['172.16.5.250/32']);
    });

    it('réintégrer (remove) recompte les events et vide le registre', async () => {
      const caller = createTestCaller(testUsers.admin);
      await seedEvents([{ created_at: daysAgo(2), ip: '1.1.1.1', type: 'address_test' }]);
      await caller.conversionTracking.ipRules.upsert({ disposition: 'exclude', ip: '1.1.1.1', reason: 'bot' });

      const removed = await caller.conversionTracking.ipRules.remove({ ip: '1.1.1.1' });
      expect(removed).toStrictEqual({ changedEvents: 1, ip: '1.1.1.1/32' });

      const [rules, excluded] = await Promise.all([caller.conversionTracking.ipRules.list(), excludedEventIps()]);
      expect(rules).toStrictEqual([]);
      expect(excluded).toStrictEqual([]);
    });

    it('conserver (keep) enregistre la règle sans exclure les events', async () => {
      const caller = createTestCaller(testUsers.admin);
      await seedEvents([{ created_at: daysAgo(2), ip: '1.1.1.1', type: 'address_test' }]);

      const rule = await caller.conversionTracking.ipRules.upsert({ disposition: 'keep', ip: '1.1.1.1', reason: 'partenaire' });
      expect(rule).toStrictEqual({ changedEvents: 0, disposition: 'keep', ip: '1.1.1.1/32', reason: 'partenaire' });
      expect(await excludedEventIps()).toStrictEqual([]);
    });

    it('règle collante : un nouvel event d’une IP déjà bannie entre exclu (hors stats)', async () => {
      const admin = createTestCaller(testUsers.admin);
      // L’IP du contexte de test vaut 127.0.0.1 → on la bannit avant l’event.
      await admin.conversionTracking.ipRules.upsert({ disposition: 'exclude', ip: '127.0.0.1', reason: 'bot' });

      await createTestCaller(null).conversionTracking.recordEvent({
        page: '/villes/paris',
        route: '/villes/[ville]',
        type: 'address_test',
      });

      const event = await kdb.selectFrom('conversion_events').select('excluded').executeTakeFirstOrThrow();
      expect(event.excluded).toStrictEqual(true);
      expect(await admin.conversionTracking.getStats(statsInput)).toStrictEqual([]);
    });

    it('rejette une IP invalide (BAD_REQUEST)', async () => {
      await expect(
        createTestCaller(testUsers.admin).conversionTracking.ipRules.upsert({ disposition: 'exclude', ip: 'pas-une-ip', reason: 'x' })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });
});
