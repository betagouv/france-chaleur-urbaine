import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- user_permissions table
    CREATE TABLE user_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      resource_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id, type, resource_id)
    );
    CREATE INDEX idx_user_permissions_user ON user_permissions (user_id, type);
    CREATE INDEX idx_user_permissions_resource ON user_permissions (type, resource_id);

    -- siret column on users
    ALTER TABLE users ADD COLUMN siret TEXT;

    -- New columns on demands
    ALTER TABLE demands ADD COLUMN network_id SMALLINT;
    ALTER TABLE demands ADD COLUMN network_type TEXT;
    ALTER TABLE demands ADD COLUMN validated BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE demands ADD COLUMN commune_code TEXT;
    ALTER TABLE demands ADD COLUMN epci_code TEXT;
    ALTER TABLE demands ADD COLUMN ept_code TEXT;
    ALTER TABLE demands ADD COLUMN departement_code TEXT;
    ALTER TABLE demands ADD COLUMN region_code TEXT;

    CREATE INDEX idx_demands_network ON demands (network_id);
    CREATE INDEX idx_demands_commune ON demands (commune_code);
    CREATE INDEX idx_demands_epci ON demands (epci_code);
    CREATE INDEX idx_demands_ept ON demands (ept_code);
    CREATE INDEX idx_demands_departement ON demands (departement_code);
    CREATE INDEX idx_demands_region ON demands (region_code);
    CREATE INDEX idx_demands_validated ON demands (validated);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS idx_demands_validated;
    DROP INDEX IF EXISTS idx_demands_region;
    DROP INDEX IF EXISTS idx_demands_departement;
    DROP INDEX IF EXISTS idx_demands_ept;
    DROP INDEX IF EXISTS idx_demands_epci;
    DROP INDEX IF EXISTS idx_demands_commune;
    DROP INDEX IF EXISTS idx_demands_network;

    ALTER TABLE demands DROP COLUMN IF EXISTS region_code;
    ALTER TABLE demands DROP COLUMN IF EXISTS departement_code;
    ALTER TABLE demands DROP COLUMN IF EXISTS ept_code;
    ALTER TABLE demands DROP COLUMN IF EXISTS epci_code;
    ALTER TABLE demands DROP COLUMN IF EXISTS commune_code;
    ALTER TABLE demands DROP COLUMN IF EXISTS validated;
    ALTER TABLE demands DROP COLUMN IF EXISTS network_type;
    ALTER TABLE demands DROP COLUMN IF EXISTS network_id;

    ALTER TABLE users DROP COLUMN IF EXISTS siret;

    DROP TABLE IF EXISTS user_permissions;
  `.execute(db);
}
