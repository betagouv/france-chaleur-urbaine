import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    -- A demand is assigned to a network by both columns or by none (the data diagnostic used to report the half-filled rows)
    ALTER TABLE demands
    ADD CONSTRAINT demands_network_id_with_type CHECK ((network_id IS NULL) = (network_type IS NULL));
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE demands
    DROP CONSTRAINT demands_network_id_with_type;
  `.execute(db);
}
