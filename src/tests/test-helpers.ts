import { type InsertObject } from 'kysely';
import { type User } from 'next-auth';

import { type DB, kdb, sql } from '@/server/db/kysely';

import { mockGetServerSession } from './setup-mocks';

export async function cleanDatabase() {
  await kdb.deleteFrom('users').execute();
}

export async function seedTableUser(users: ReadonlyArray<Partial<InsertObject<DB, 'users'>>>) {
  await kdb
    .insertInto('users')
    .values(
      users.map((user) => {
        const id = user.id ?? crypto.randomUUID();
        return {
          id,
          email: `user-${id}@test.local`,
          password: 'hashed_password',
          role: 'professionnel' as const,
          last_connection: sql`NOW()`,
          status: 'valid' as const,
          active: true,
          ...user,
        };
      })
    )
    .execute();
}

/**
 * Convert a number to a uuid for tests.
 *
 * Note: the number must be <= 999999999999
 */
export function uuid(i: number): string {
  return `${'00000000-0000-0000-0000-000000000000'.substr(0, 36 - `${i}`.length)}${i}`;
}

/**
 * Mock la session utilisateur pour les tests d'API
 */
export function mockUserSession(user: Partial<User> | null) {
  mockGetServerSession.mockResolvedValue(
    user
      ? {
          user,
          expires: new Date(Date.now() + 86400000).toISOString(), // 24h
        }
      : null
  );
}
