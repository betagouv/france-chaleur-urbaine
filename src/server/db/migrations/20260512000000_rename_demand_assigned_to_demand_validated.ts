import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE events
    SET type = 'demand_validated'
    WHERE type = 'demand_assigned'
      AND context_type = 'demand';
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE events
    SET type = 'demand_assigned'
    WHERE type = 'demand_validated'
      AND context_type = 'demand';
  `.execute(db);
}
