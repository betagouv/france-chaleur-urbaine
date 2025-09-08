import { type InsertObject, sql } from 'kysely';
import { type NextApiRequest, type NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it } from 'vitest';

import usersStatsHandler from '@/pages/api/admin/users-stats';
import { type DB } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { mockUserSession, uuid } from '@/tests/helpers';

const adminUser = {
  id: uuid(1),
  role: 'admin' as const,
  email: `user-${uuid(1)}@test.local`,
  active: true,
} satisfies Partial<InsertObject<DB, 'users'>>;

const particulierUser = {
  id: uuid(2),
  role: 'particulier' as const,
  email: `user-${uuid(2)}@test.local`,
  active: true,
} satisfies Partial<InsertObject<DB, 'users'>>;

describe('API /admin/users-stats', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([
      {
        ...adminUser,
        last_connection: sql`NOW() - INTERVAL '2 HOUR'`,
      },
      {
        ...particulierUser,
        last_connection: sql`NOW() - INTERVAL '1 HOUR'`,
      },
      {
        id: uuid(3),
        role: 'professionnel',
        last_connection: sql`NOW() - INTERVAL '12 HOUR'`,
      },
      {
        id: uuid(4),
        role: 'gestionnaire',
        last_connection: sql`NOW() - INTERVAL '3 DAY'`,
      },
      {
        id: uuid(5),
        role: 'particulier',
        last_connection: sql`NOW() - INTERVAL '10 DAY'`,
      },
    ]);
  });

  describe('GET /admin/users-stats', () => {
    describe('Permissions', () => {
      it.each([
        {
          description: 'utilisateur non authentifié',
          user: null,
          expectedStatus: 401,
          expectedBody: {
            message: 'Authentification requise',
          },
        },
        {
          description: 'utilisateur non admin',
          user: particulierUser,
          expectedStatus: 403,
          expectedBody: {
            message: 'Permissions invalides',
          },
        },
        {
          description: 'utilisateur admin',
          user: adminUser,
          expectedStatus: 200,
          expectedBody: {
            last3h: 1,
            last24h: 2,
            last7d: 3,
          },
        },
      ])('devrait retourner $expectedStatus pour $description', async ({ user, expectedStatus, expectedBody }) => {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
        mockUserSession(user);

        await usersStatsHandler(req, res);
        expect(res.statusCode).toEqual(expectedStatus);
        expect(res._getJSONData()).toEqual(expectedBody);
      });
    });
  });
});
