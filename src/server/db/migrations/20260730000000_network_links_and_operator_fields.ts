import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- Extension → parent RC link, edited in the FCU admin (never synced from Airtable)
    ALTER TABLE zones_et_reseaux_en_construction
    ADD COLUMN IF NOT EXISTS reseau_de_chaleur_id smallint REFERENCES reseaux_de_chaleur(id_fcu) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS zones_et_reseaux_en_construction_reseau_de_chaleur_idx
    ON zones_et_reseaux_en_construction (reseau_de_chaleur_id);

    -- Redundant copy of the parent RC SNCU, maintained by syncLinkedNetworkFields (used by tiles/filters)
    ALTER TABLE zones_et_reseaux_en_construction
    ADD COLUMN IF NOT EXISTS "Identifiant reseau" character varying(254);

    -- Operator fields on PDP, auto-filled from linked networks when empty, then admin-owned
    ALTER TABLE zone_de_developpement_prioritaire
    ADD COLUMN IF NOT EXISTS "Gestionnaire" character varying(254),
    ADD COLUMN IF NOT EXISTS "MO" character varying(254);

    -- The SNCU id is the link key between RC and their extensions/PDP: enforce its de facto uniqueness
    CREATE UNIQUE INDEX IF NOT EXISTS reseaux_de_chaleur_identifiant_reseau_unique_idx
    ON reseaux_de_chaleur ("Identifiant reseau")
    WHERE "Identifiant reseau" IS NOT NULL AND "Identifiant reseau" <> '';
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS reseaux_de_chaleur_identifiant_reseau_unique_idx;

    ALTER TABLE zone_de_developpement_prioritaire
    DROP COLUMN IF EXISTS "Gestionnaire",
    DROP COLUMN IF EXISTS "MO";

    ALTER TABLE zones_et_reseaux_en_construction
    DROP COLUMN IF EXISTS "Identifiant reseau";

    DROP INDEX IF EXISTS zones_et_reseaux_en_construction_reseau_de_chaleur_idx;

    ALTER TABLE zones_et_reseaux_en_construction
    DROP COLUMN IF EXISTS reseau_de_chaleur_id;
  `.execute(db);
}
