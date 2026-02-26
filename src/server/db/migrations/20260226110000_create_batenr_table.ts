import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS bdnb_batenr (
      batiment_construction_id character varying(22),
      batiment_groupe_id character varying(22),
      adresse character varying(254),
      gmi_nappe_200 int,
      pot_nappe int,
      place_nappe boolean,
      gmi_sonde_200 int,
      gis_geo_profonde boolean,
      ac1 boolean,
      ac2 boolean,
      ac3 boolean,
      ac4 boolean,
      ac4bis boolean,
      liste_ppa character varying(40),
      etat_ppa character varying(15),
      geom geometry(MultiPolygon,2154)
    );
    CREATE INDEX IF NOT EXISTS bdnb_batenr_batiment_construction_id_idx ON bdnb_batenr (batiment_construction_id);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS bdnb_batenr;
  `.execute(db);
}
