import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { formatAsISODate } from '@/utils/date';
import { type GeometryWithSrid } from '@cli/helpers/geo';

/**
 * Crée une expression SQL pour transformer une géométrie GeoJSON en géométrie PostGIS
 */
function createGeometryExpression(geom: GeoJSON.Geometry, srid: number) {
  return srid === 4326
    ? sql<any>`st_transform(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`
    : sql<any>`st_setsrid(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`;
}

/**
 * Expression SQL pour calculer les codes INSEE des communes intersectant une géométrie
 */
const communesInseeExpressionGeom = sql<string[]>`COALESCE(
  (
    SELECT array_agg(insee_com order by insee_com)
    FROM geometry
    JOIN ign_communes on ST_Intersects(geometry.geom, ign_communes.geom_150m)
  ),
  (
    SELECT array_agg(insee_com order by insee_com)
    FROM geometry
    JOIN ign_communes on ST_Intersects(geometry.geom, ign_communes.geom)
  ),
  '{}'
)::text[]`;

/**
 * Définition des tables de réseaux et leurs colonnes spécifiques
 */
export type NetworkTable =
  | 'reseaux_de_chaleur'
  | 'reseaux_de_froid'
  | 'zones_et_reseaux_en_construction'
  | 'zone_de_developpement_prioritaire';

type NetworkTableColumns = {
  [K in NetworkTable]: {
    idField: string;
    geomDependentFields: (eb: any) => Record<string, any>;
    createFields?: (eb: any) => Record<string, any>;
    additionalFields?: (id_sncu?: string) => Record<string, any>;
  };
};

const networkTables: NetworkTableColumns = {
  reseaux_de_chaleur: {
    idField: 'id_fcu',
    geomDependentFields: (eb) => ({
      has_trace: eb.selectFrom('geometry').select(sql<boolean>`st_geometrytype(geometry.geom) = 'ST_MultiLineString'`.as('has_trace')),
    }),
    createFields: (eb) => ({
      'reseaux classes': false,
      reseaux_techniques: false,
      fichiers: eb.val([]),
    }),
    additionalFields: (id_sncu?: string) => (id_sncu ? { 'Identifiant reseau': id_sncu } : {}),
  },
  reseaux_de_froid: {
    idField: 'id_fcu',
    geomDependentFields: (eb) => ({
      has_trace: eb.selectFrom('geometry').select(sql<boolean>`st_geometrytype(geometry.geom) = 'ST_MultiLineString'`.as('has_trace')),
    }),
    createFields: (eb) => ({
      'reseaux classes': false,
      fichiers: eb.val([]),
    }),
    additionalFields: (id_sncu?: string) => (id_sncu ? { 'Identifiant reseau': id_sncu } : {}),
  },
  zone_de_developpement_prioritaire: {
    idField: 'id_fcu',
    geomDependentFields: () => ({}),
    additionalFields: (id_sncu?: string) => (id_sncu ? { 'Identifiant reseau': id_sncu } : {}),
  },
  zones_et_reseaux_en_construction: {
    idField: 'id_fcu',
    geomDependentFields: (eb) => ({
      is_zone: eb
        .selectFrom('geometry')
        .select(
          sql<boolean>`st_geometrytype(geometry.geom) = 'ST_MultiPolygon' or st_geometrytype(geometry.geom) = 'ST_Polygon'`.as('is_zone')
        ),
    }),
  },
};

/**
 * Met à jour les champs département et région pour une entité (les labels sont concaténés).
 */
async function updateLabelsCommunesDepartementAndRegion(tableName: NetworkTable, id_fcu: number): Promise<void> {
  await kdb
    .updateTable(tableName)
    .where('id_fcu', '=', id_fcu)
    .set({
      communes: sql<string[]>`(
        SELECT array_agg(ic.nom ORDER BY ic.nom)
        FROM unnest(${sql.raw(tableName)}.communes_insee) as ci
        JOIN ign_communes ic ON ic.insee_com = ci
        WHERE ${sql.raw(tableName)}.id_fcu = ${id_fcu}
      )`,
      departement: sql<string>`(
        SELECT string_agg(DISTINCT id.nom, ', ' ORDER BY id.nom)
        FROM unnest(${sql.raw(tableName)}.communes_insee) as ci
        JOIN ign_communes ic ON ic.insee_com = ci
        JOIN ign_departements id ON id.insee_dep = ic.insee_dep
        WHERE ${sql.raw(tableName)}.id_fcu = ${id_fcu}
      )`,
      region: sql<string>`(
        SELECT string_agg(DISTINCT ir.nom, ', ' ORDER BY ir.nom)
        FROM unnest(${sql.raw(tableName)}.communes_insee) as ci
        JOIN ign_communes ic ON ic.insee_com = ci
        JOIN ign_regions ir ON ir.insee_reg = ic.insee_reg
        WHERE ${sql.raw(tableName)}.id_fcu = ${id_fcu}
      )`,
    })
    .execute();

  logger.info(`Département et région mis à jour pour ${tableName} avec id_fcu: ${id_fcu}`);
}

/**
 * Insère une nouvelle entité avec une géométrie.
 */
export async function insertEntityWithGeometry(
  tableName: NetworkTable,
  geometryConfig: GeometryWithSrid,
  options: {
    id_fcu?: number;
    id_sncu?: string;
  } = {}
) {
  const { id_fcu, id_sncu } = options;

  const inserted = await kdb
    .with('geometry', (db) => db.selectNoFrom(createGeometryExpression(geometryConfig.geom, geometryConfig.srid).as('geom')))
    .insertInto(tableName as any)
    .values((eb) => ({
      id_fcu: id_fcu ? eb.lit(id_fcu) : sql<number>`(SELECT COALESCE(max(id_fcu), 0) + 1 FROM ${sql.raw(tableName)})`,
      geom: eb.selectFrom('geometry').select('geometry.geom'),
      communes_insee: communesInseeExpressionGeom,
      date_actualisation_trace: eb.val(new Date()),
      ...networkTables[tableName].geomDependentFields(eb),
      ...networkTables[tableName].createFields?.(eb),
      ...networkTables[tableName].additionalFields?.(id_sncu),
    }))
    .returning('id_fcu')
    .executeTakeFirstOrThrow();

  await updateLabelsCommunesDepartementAndRegion(tableName, inserted.id_fcu);

  logger.info(`Géométrie créée pour ${tableName} avec id_fcu: ${inserted.id_fcu}`);
}

/**
 * Met à jour la géométrie d'une entité existante.
 */
export async function updateEntityGeometry(
  tableName: NetworkTable,
  idField: string,
  idValue: string | number,
  geometryConfig: GeometryWithSrid,
  options: {
    extend?: boolean;
  } = {}
): Promise<void> {
  const existingEntities = await kdb
    .selectFrom(tableName as any)
    .select(['id_fcu', sql<GeoJSON.Geometry>`ST_AsGeoJSON(geom)::json`.as('geom')])
    .where(idField, '=', idValue)
    .execute();

  if (existingEntities.length === 0) {
    throw new Error(`Aucune entité trouvée avec ${idField} = ${idValue}`);
  }
  if (existingEntities.length > 1) {
    throw new Error(`Plusieurs entités trouvées avec ${idField} = ${idValue}`);
  }

  const existingEntity = existingEntities[0];

  const id_fcu = existingEntity.id_fcu;

  let finalGeometry = createGeometryExpression(geometryConfig.geom, geometryConfig.srid);

  if (options.extend && existingEntity.geom) {
    // Combine existing geometry with new geometry using ST_Union
    finalGeometry = sql`(
      SELECT ST_Union(
        ${finalGeometry},
        ${createGeometryExpression(existingEntity.geom, 2154)}
      )
    )`;
  }

  await kdb
    .with('geometry', (db) => db.selectNoFrom(finalGeometry.as('geom')))
    .updateTable(tableName as any)
    .where('id_fcu', '=', id_fcu)
    .set((eb) => ({
      geom: eb.selectFrom('geometry').select('geometry.geom'),
      communes_insee: communesInseeExpressionGeom,
      date_actualisation_trace: eb.val(new Date()),
      ...networkTables[tableName].geomDependentFields(eb),
    }))
    .execute();

  await updateLabelsCommunesDepartementAndRegion(tableName, id_fcu);

  logger.info(`Géométrie ${options.extend ? 'étendue' : 'mise à jour'} pour ${tableName} avec ${idField} = ${idValue}`);
}

/**
 * Met à jour les informations d'une entité sans modifier sa géométrie.
 * Par exemple après avoir fait une opération manuelle pour fusionner des entités.
 */
export async function updateEntityWithoutGeometry(tableName: NetworkTable, idField: string, idValue: string | number): Promise<void> {
  const existingEntity = await kdb
    .selectFrom(tableName as any)
    .select(sql<GeoJSON.Geometry>`ST_AsGeoJSON(geom)::json`.as('geom'))
    .where(idField, '=', idValue)
    .executeTakeFirst();

  if (!existingEntity) {
    throw new Error(`Aucune entité trouvée avec ${idField} = ${idValue}`);
  }

  await updateEntityGeometry(tableName, idField, idValue, { geom: existingEntity.geom, srid: 2154 });
}

/**
 * Crée un PDP à partir d'une commune
 */
export async function createPDPFromCommune(code_insee: string, id_sncu?: string) {
  const existingCommune = await kdb
    .selectFrom('ign_communes')
    .select((eb) => sql<GeoJSON.Geometry>`ST_AsGeoJSON(${eb.ref('geom')})::json`.as('geom'))
    .where('insee_com', '=', code_insee)
    .executeTakeFirst();
  if (!existingCommune) {
    throw new Error(`La commune ${code_insee} n'a pas été trouvée`);
  }
  return insertEntityWithGeometry('zone_de_developpement_prioritaire', { geom: existingCommune.geom, srid: 2154 }, { id_sncu });
}

/**
 * Met à jour le champ has_PDP d'un réseau
 */
export async function updateNetworkHasPDP(id_sncu: string): Promise<void> {
  const res = await kdb
    .updateTable('reseaux_de_chaleur')
    .where('Identifiant reseau', '=', id_sncu)
    .set({
      has_PDP: true,
      date_actualisation_pdp: formatAsISODate(new Date()),
    })
    .returning('id_fcu')
    .executeTakeFirst();

  logger.info(
    res?.id_fcu ? `Réseau de chaleur mis à jour (has_PDP): ${res.id_fcu}` : `Aucun réseau de chaleur trouvé avec ${id_sncu} (has_PDP)`
  );
}
