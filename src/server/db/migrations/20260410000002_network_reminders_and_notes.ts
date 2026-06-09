import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS network_reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      network_id INTEGER NOT NULL,
      network_type TEXT NOT NULL,
      type TEXT NOT NULL,
      author_id UUID REFERENCES users(id),
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_network_reminders_network ON network_reminders (network_id, network_type, type);

    ALTER TABLE reseaux_de_chaleur ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE reseaux_de_froid ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE zones_et_reseaux_en_construction ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE zone_de_developpement_prioritaire ADD COLUMN IF NOT EXISTS notes TEXT;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE zone_de_developpement_prioritaire DROP COLUMN IF EXISTS notes;
    ALTER TABLE zones_et_reseaux_en_construction DROP COLUMN IF EXISTS notes;
    ALTER TABLE reseaux_de_froid DROP COLUMN IF EXISTS notes;
    ALTER TABLE reseaux_de_chaleur DROP COLUMN IF EXISTS notes;
    DROP TABLE IF EXISTS network_reminders;
  `.execute(db);
}
