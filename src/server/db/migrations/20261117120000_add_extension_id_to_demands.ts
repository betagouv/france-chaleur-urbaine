import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    -- Nearest network of a demand when it is an extension linked to a heat network: the demand itself is carried by the parent
    -- network (network_id / network_type). Deleting the extension (commissioning) leaves the demand on its parent.
    ALTER TABLE demands
    ADD COLUMN extension_id smallint REFERENCES zones_et_reseaux_en_construction(id_fcu) ON DELETE SET NULL;

    ALTER TABLE demands
    ADD CONSTRAINT demands_extension_on_reseau_de_chaleur CHECK (extension_id IS NULL OR network_type = 'reseau_de_chaleur');

    CREATE INDEX idx_demands_extension ON demands (extension_id) WHERE extension_id IS NOT NULL;
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    -- the demands carried by a parent network go back to their extension
    UPDATE demands
    SET network_id = extension_id, network_type = 'reseau_en_construction'
    WHERE extension_id IS NOT NULL;

    DROP INDEX idx_demands_extension;

    ALTER TABLE demands
    DROP CONSTRAINT demands_extension_on_reseau_de_chaleur,
    DROP COLUMN extension_id;
  `.execute(db);
}
