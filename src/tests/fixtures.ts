import type { InsertObject } from 'kysely';

import { type DB, kdb, sql } from '@/server/db/kysely';

export async function cleanDatabase() {
  await kdb.deleteFrom('users').execute();
}

export async function seedTableUser(users: readonly Partial<InsertObject<DB, 'users'>>[]) {
  await kdb
    .insertInto('users')
    .values(
      users.map((user) => {
        const id = user.id ?? crypto.randomUUID();
        return {
          active: true,
          email: `user-${id}@test.local`,
          id,
          last_connection: sql`NOW()`,
          password: 'hashed_password',
          role: 'professionnel' as const,
          status: 'valid' as const,
          ...user,
        };
      })
    )
    .execute();
}
