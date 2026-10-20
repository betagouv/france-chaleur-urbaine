import type { Kysely } from 'kysely';
import { sql } from 'kysely';

// The Airtable attachments were imported into files + network_files: the legacy jsonb column only holds expired URLs.
// network_files.position was never updated after the insertion: documents are listed in publication order (created_at).
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE reseaux_de_chaleur DROP COLUMN fichiers;
    ALTER TABLE reseaux_de_froid DROP COLUMN fichiers;
    ALTER TABLE network_files DROP COLUMN position;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE reseaux_de_chaleur ADD COLUMN fichiers jsonb;
    ALTER TABLE reseaux_de_froid ADD COLUMN fichiers jsonb;
    ALTER TABLE network_files ADD COLUMN position integer NOT NULL DEFAULT 0;
  `.execute(db);
}
