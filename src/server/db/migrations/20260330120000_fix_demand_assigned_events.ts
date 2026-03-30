import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE events
    SET type = 'demand_assigned'
    WHERE type = 'demand_updated'
      AND context_type = 'demand'
      AND (data->>'Gestionnaires validés')::boolean = true
      AND created_at >= '2025-11-25';
  `.execute(db);
}

export async function down(): Promise<void> {}
