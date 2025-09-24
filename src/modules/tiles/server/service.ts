import { type ExpressionBuilder } from 'kysely';

import { type NetworkTable } from '@/modules/reseaux/server/geometry-operations';
import { type BuildTilesInput, type SyncGeometriesInput } from '@/modules/tiles/constants';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { type ApiContext } from '@/server/db/kysely/base-model';

export const createBuildTilesJob = async ({ name }: BuildTilesInput, context: ApiContext) => {
  return await kdb
    .insertInto('jobs')
    .values({
      type: 'build_tiles',
      data: {
        name,
      },
      status: 'pending',
      user_id: context.user.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const createSyncGeometriesToAirtableJob = async ({ name }: SyncGeometriesInput, context: ApiContext) => {
  return await kdb
    .insertInto('jobs')
    .values({
      type: 'sync_geometries_to_airtable',
      data: { name },
      status: 'pending',
      user_id: context.user.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const createSyncMetadataFromAirtableJob = async ({ name }: SyncGeometriesInput, context: ApiContext) => {
  return await kdb
    .insertInto('jobs')
    .values({
      type: 'sync_metadata_from_airtable',
      data: { name },
      status: 'pending',
      user_id: context.user.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

type TableConfig = {
  tableName: NetworkTable;
  internalName: BuildTilesInput['name'];
  tileName: string;
};

const tables: TableConfig[] = [
  {
    tableName: 'reseaux_de_chaleur',
    internalName: 'reseaux-de-chaleur',
    tileName: 'network',
  },
  {
    tableName: 'reseaux_de_froid',
    internalName: 'reseaux-de-froid',
    tileName: 'coldNetwork',
  },
  {
    tableName: 'zones_et_reseaux_en_construction',
    internalName: 'reseaux-en-construction',
    tileName: 'futurNetwork',
  },
  {
    tableName: 'zone_de_developpement_prioritaire',
    internalName: 'perimetres-de-developpement-prioritaire',
    tileName: 'zoneDP',
  },
];

export const getTileNameFromInternalName = (internalName: string) => {
  return tables.find((table) => table.internalName === internalName)?.tileName;
};

/**
 * Expression SQL pour calculer les codes INSEE des communes intersectant une géométrie mise à jour
 */
const communesInseeExpressionGeomUpdate = sql<string[]>`COALESCE(
  (
    SELECT array_agg(insee_com order by insee_com)
    FROM ign_communes
    WHERE ST_Intersects(geom_update, ign_communes.geom_150m)
  ),
  (
    SELECT array_agg(insee_com order by insee_com)
    FROM ign_communes
    WHERE ST_Intersects(geom_update, ign_communes.geom)
  ),
  '{}'
)::text[]`;

/**
 * Définition des champs dépendants de la géométrie pour chaque table
 */
const networkTablesGeomFields: {
  [K in NetworkTable]: (eb: ExpressionBuilder<DB, K>) => Record<string, any>;
} = {
  reseaux_de_chaleur: (eb) => ({
    has_trace: sql<boolean>`st_geometrytype(${eb.ref('geom_update')}) = 'ST_MultiLineString'`,
  }),
  reseaux_de_froid: () => ({
    // has_trace: sql<boolean>`st_geometrytype(${eb.ref('geom_update')}) = 'ST_MultiLineString'`,
  }),
  zone_de_developpement_prioritaire: () => ({}),
  zones_et_reseaux_en_construction: (eb) => ({
    is_zone: sql<boolean>`st_geometrytype(${eb.ref('geom_update')}) = 'ST_MultiPolygon' or st_geometrytype(geom_update) = 'ST_Polygon'`,
  }),
};

/**
 * Met à jour les champs département et région pour une entité
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
}

const processTableGeometryUpdates = async (config: TableConfig) => {
  const [created, updated, deleted] = await Promise.all([
    // Créations (!geom && geom_update)
    kdb
      .updateTable(config.tableName)
      .set((eb) => ({
        geom: eb.ref('geom_update'),
        geom_update: null,
        communes_insee: communesInseeExpressionGeomUpdate,
        date_actualisation_trace: eb.val(new Date()),
        ...networkTablesGeomFields[config.tableName](eb),
      }))
      .where('geom', 'is', null)
      .where('geom_update', 'is not', null)
      .where(sql<boolean>`NOT ST_IsEmpty(geom_update)`)
      .returning('id_fcu')
      .execute(),

    // Mises à jour (geom && geom_update)
    kdb
      .updateTable(config.tableName)
      .set((eb) => ({
        geom: eb.ref('geom_update'),
        geom_update: null,
        communes_insee: communesInseeExpressionGeomUpdate,
        date_actualisation_trace: eb.val(new Date()),
        ...networkTablesGeomFields[config.tableName](eb),
      }))
      .where('geom', 'is not', null)
      .where('geom_update', 'is not', null)
      .where(sql<boolean>`NOT ST_IsEmpty(geom_update)`)
      .returning('id_fcu')
      .execute(),

    // Suppressions (geom_update vide)
    kdb
      .deleteFrom(config.tableName)
      .where('geom_update', 'is not', null)
      .where(sql<boolean>`ST_IsEmpty(geom_update)`)
      .returning('id_fcu')
      .execute(),
  ]);

  // Met à jour les labels pour les entités créées et modifiées
  const allUpdatedIds = [...created, ...updated];
  await Promise.all(allUpdatedIds.map((entity) => updateLabelsCommunesDepartementAndRegion(config.tableName, entity.id_fcu)));

  return {
    config,
    created: created.length,
    updated: updated.length,
    deleted: deleted.length,
    total: created.length + updated.length + deleted.length,
  };
};

export const applyGeometriesUpdates = async ({ name }: SyncGeometriesInput, context: ApiContext) => {
  const updateResult = tables.find((table) => table.internalName === name);
  if (!updateResult) {
    throw new Error(`Table ${name} not found`);
  }

  const updateResults = await processTableGeometryUpdates(updateResult);

  // Récupère les statistiques
  const processed = {
    created: updateResults.created,
    updated: updateResults.updated,
    deleted: updateResults.deleted,
    total: updateResults.total,
  };

  const syncMetadataJob = await createSyncMetadataFromAirtableJob({ name }, context);
  const tileJob = await createBuildTilesJob({ name }, context);
  const syncGeometriesJob = await createSyncGeometriesToAirtableJob({ name }, context);

  const allJobIds = [tileJob.id, syncGeometriesJob.id, syncMetadataJob.id];

  return {
    processed,
    jobIds: allJobIds,
  };
};
