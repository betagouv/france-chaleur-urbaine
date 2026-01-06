import { type InsertObject, sql } from 'kysely';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it } from 'vitest';

import usersStatsHandler from '@/pages/api/admin/users-stats';
import type { DB } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { mockUserSession, uuid } from '@/tests/helpers';

const adminUser = {
  active: true,
  email: `user-${uuid(1)}@test.local`,
  id: uuid(1),
  role: 'admin' as const,
} satisfies Partial<InsertObject<DB, 'users'>>;

const particulierUser = {
  active: true,
  email: `user-${uuid(2)}@test.local`,
  id: uuid(2),
  role: 'particulier' as const,
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
        last_connection: sql`NOW() - INTERVAL '12 HOUR'`,
        role: 'professionnel',
      },
      {
        id: uuid(4),
        last_connection: sql`NOW() - INTERVAL '3 DAY'`,
        role: 'gestionnaire',
      },
      {
        id: uuid(5),
        last_connection: sql`NOW() - INTERVAL '10 DAY'`,
        role: 'particulier',
      },
    ]);
  });

  describe('GET /admin/users-stats', () => {
    describe('Permissions', () => {
      it.each([
        {
          description: 'utilisateur non authentifié',
          expectedBody: {
            message: 'Authentification requise',
          },
          expectedStatus: 401,
          user: null,
        },
        {
          description: 'utilisateur non admin',
          expectedBody: {
            message: 'Permissions invalides',
          },
          expectedStatus: 403,
          user: particulierUser,
        },
        {
          description: 'utilisateur admin',
          expectedBody: {
            last3h: 1,
            last7d: 3,
            last24h: 2,
          },
          expectedStatus: 200,
          user: adminUser,
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
