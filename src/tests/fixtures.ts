import { type InsertObject } from 'kysely';

import { type DB, kdb, sql } from '@/server/db/kysely';

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
