import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { readFileGeometry } from '@cli/helpers/geo';

/**
 * Crée une expression SQL pour transformer une géométrie GeoJSON en géométrie PostGIS
 */
function createGeometryExpression(geom: GeoJSON.Geometry, srid: number) {
  return srid === 4326
    ? sql<any>`st_transform(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`
    : sql<any>`st_setsrid(ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))}), 2154)`;
}

/**
 * Expression SQL pour calculer les communes intersectant une géométrie
 */
const communesIntersectionExpression = sql<string[]>`COALESCE(
  (
    SELECT array_agg(nom order by nom)
    FROM ign_communes
    WHERE ST_Intersects(geometry.geom, st_buffer(ign_communes.geom, -150))
  ),
  (
    SELECT array_agg(nom order by nom)
    FROM ign_communes
    WHERE ST_Intersects(geometry.geom, ign_communes.geom)
  ),
  '{}'
)::text[]`;

const communesIntersectionExpressionGeom = sql<string[]>`COALESCE(
  (
    SELECT array_agg(nom order by nom)
    FROM geometry
    JOIN ign_communes on ST_Intersects(geometry.geom, st_buffer(ign_communes.geom, -150))
  ),
  (
    SELECT array_agg(nom order by nom)
    FROM geometry
    JOIN ign_communes on ST_Intersects(geometry.geom, ign_communes.geom)
  )
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
 * Insère une nouvelle entité avec une géométrie.
 */
export async function insertEntityWithGeometry(
  tableName: NetworkTable,
  fileName: string,
  options: {
    id_fcu?: number;
    id_sncu?: string;
  } = {}
): Promise<{ id_fcu: number }> {
  const { geom, srid } = await readFileGeometry(fileName);
  const { id_fcu, id_sncu } = options;

  const inserted = await kdb
    .with('geometry', (db) => db.selectNoFrom(createGeometryExpression(geom, srid).as('geom')))
    .insertInto(tableName as any)
    .values((eb) => ({
      id_fcu: id_fcu ? eb.lit(id_fcu) : sql<number>`(SELECT COALESCE(max(id_fcu), 0) + 1 FROM ${sql.raw(tableName)})`,
      geom: eb.selectFrom('geometry').select('geometry.geom'),
      communes: communesIntersectionExpressionGeom,
      ...networkTables[tableName].geomDependentFields(eb),
      ...networkTables[tableName].createFields?.(eb),
      ...networkTables[tableName].additionalFields?.(id_sncu),
    }))
    .returning('id_fcu')
    .executeTakeFirstOrThrow();

  logger.info(`Réseau créé dans ${tableName} avec id_fcu: ${inserted.id_fcu}`);
  return inserted;
}

/**
 * Met à jour la géométrie d'une entité existante.
 */
export async function updateEntityGeometry(
  tableName: NetworkTable,
  idField: string,
  idValue: string | number,
  fileName: string
): Promise<void> {
  const { geom, srid } = await readFileGeometry(fileName);

  const existingEntities = await kdb
    .selectFrom(tableName as any)
    .select('id_fcu')
    .where(idField, '=', idValue)
    .execute();

  if (existingEntities.length === 0) {
    throw new Error(`Aucune entité trouvée avec ${idField} = ${idValue}`);
  }
  if (existingEntities.length > 1) {
    throw new Error(`Plusieurs entités trouvées avec ${idField} = ${idValue}`);
  }

  const updateQuery = kdb
    .with('geometry', (db) => db.selectNoFrom(createGeometryExpression(geom, srid).as('geom')))
    .updateTable(tableName as any)
    .where('id_fcu', '=', existingEntities[0].id_fcu)
    .set((eb) => ({
      geom: eb.selectFrom('geometry').select('geometry.geom'),
      communes: communesIntersectionExpressionGeom,
      ...networkTables[tableName].geomDependentFields(eb),
    }));

  await updateQuery.execute();

  logger.info(`Géométrie mise à jour pour ${tableName} avec ${idField} = ${idValue}`);
}

/**
 * Crée un PDP à partir d'une commune
 */
export async function createPDPFromCommune(code_insee: string, id_sncu?: string): Promise<{ id_fcu: number }> {
  const communeExists = await kdb.selectFrom('ign_communes').select('id').where('insee_com', '=', code_insee).executeTakeFirst();
  if (!communeExists) {
    throw new Error(`La commune ${code_insee} n'a pas été trouvée`);
  }

  const inserted = await kdb
    .with('geometry', (db) => db.selectFrom('ign_communes').select('geom').where('insee_com', '=', code_insee))
    .insertInto('zone_de_developpement_prioritaire')
    .values((eb) => ({
      id_fcu: sql<number>`(SELECT COALESCE(max(id_fcu), 0) + 1 FROM zone_de_developpement_prioritaire)`,
      geom: eb.selectFrom('geometry').select('geometry.geom'),
      'Identifiant reseau': id_sncu || null,
      communes: communesIntersectionExpression,
    }))
    .returning('id_fcu')
    .executeTakeFirstOrThrow();

  logger.info(`PDP créé à partir de la commune ${code_insee} avec id_fcu: ${inserted.id_fcu}`);

  if (id_sncu) {
    await updateNetworkHasPDP(id_sncu);
  }

  return inserted;
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
    })
    .returning('id_fcu')
    .executeTakeFirstOrThrow();

  logger.info(`Réseau de chaleur mis à jour (has_PDP): ${res.id_fcu}`);
}
