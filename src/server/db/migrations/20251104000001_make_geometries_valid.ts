import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE reseaux_de_chaleur
    SET geom = 
      ST_CollectionExtract(
        ST_MakeValid(geom),
        2
      )
    WHERE ST_IsValid(geom) is false
      and st_geometrytype(geom) = 'ST_MultiLineString';

    UPDATE reseaux_de_froid
    SET geom = 
      ST_CollectionExtract(
        ST_MakeValid(geom),
        2
      )
    WHERE ST_IsValid(geom) is false
      and st_geometrytype(geom) = 'ST_MultiLineString';

    UPDATE zone_de_developpement_prioritaire
    SET geom = 
      ST_CollectionExtract(
        ST_MakeValid(geom),
        3
      )
    WHERE ST_IsValid(geom) is false
      and st_geometrytype(geom) = 'ST_MultiPolygon';

    UPDATE zones_et_reseaux_en_construction
    SET geom = 
      ST_CollectionExtract(
        ST_MakeValid(geom),
        2
      )
    WHERE ST_IsValid(geom) is false
      and st_geometrytype(geom) = 'ST_MultiLineString';
    
    UPDATE zones_et_reseaux_en_construction
    SET geom = 
      ST_CollectionExtract(
        ST_MakeValid(geom),
        3
      )
    WHERE ST_IsValid(geom) is false
      and st_geometrytype(geom) = 'ST_MultiPolygon';
  `);
}

export async function down() {}
