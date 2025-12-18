import type { InsertObject, Selectable } from 'kysely';

import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { type DB, kdb, sql } from '@/server/db/kysely';

export async function cleanDatabase() {
  // Order matters due to foreign key constraints
  // Clean all tables that reference users (directly or indirectly)
  await kdb.deleteFrom('demand_emails').execute();
  await kdb.deleteFrom('tags_reminders').execute();
  await kdb.deleteFrom('events').execute();
  await kdb.deleteFrom('pro_eligibility_tests_addresses').execute();
  await kdb.deleteFrom('demands').execute();
  await kdb.deleteFrom('pro_eligibility_tests').execute();
  await kdb.deleteFrom('jobs').execute();
  await kdb.deleteFrom('users').execute();
}

export async function cleanDemandsTables() {
  await kdb.deleteFrom('demand_emails').execute();
  await kdb.deleteFrom('events').execute();
  await kdb.deleteFrom('pro_eligibility_tests_addresses').execute();
  await kdb.deleteFrom('demands').execute();
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

export async function seedProEligibilityTestsAddress(
  data: Partial<InsertObject<DB, 'pro_eligibility_tests_addresses'>> & { source_address: string }
): Promise<Selectable<DB['pro_eligibility_tests_addresses']>> {
  const defaultHistory: ProEligibilityTestHistoryEntry[] = [
    {
      calculated_at: new Date().toISOString(),
      eligibility: {
        contenu_co2_acv: undefined,
        distance: 45,
        eligible: true,
        id_fcu: 7501,
        id_sncu: '7501C',
        nom: 'CPCU',
        taux_enrr: undefined,
        type: 'reseau_existant_proche',
      },
      transition: 'initial',
    },
  ];

  const [result] = await kdb
    .insertInto('pro_eligibility_tests_addresses')
    .values({
      ban_address: data.ban_address ?? data.source_address,
      ban_score: data.ban_score ?? 95,
      ban_valid: data.ban_valid ?? true,
      eligibility_history: data.eligibility_history ?? JSON.stringify(defaultHistory),
      geom: data.geom ?? sql`st_transform(st_point(2.3522, 48.8566, 4326), 2154)`,
      ...data,
    })
    .returningAll()
    .execute();

  return result;
}
