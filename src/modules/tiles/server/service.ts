import { type BuildTilesInput } from '@/modules/tiles/constants';
import { kdb, sql } from '@/server/db/kysely';
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

type TableConfig = {
  tableName: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire';
  internalName: BuildTilesInput['name'];
};

const tables: TableConfig[] = [
  {
    tableName: 'reseaux_de_chaleur',
    internalName: 'reseaux-de-chaleur',
  },
  {
    tableName: 'zones_et_reseaux_en_construction',
    internalName: 'reseaux-en-construction',
  },
  {
    tableName: 'zone_de_developpement_prioritaire',
    internalName: 'perimetres-de-developpement-prioritaire',
  },
];

const processTableGeometryUpdates = async (config: TableConfig) => {
  const [created, updated, deleted] = await Promise.all([
    // Créations (!geom && geom_update)
    kdb
      .updateTable(config.tableName)
      .set((eb) => ({
        geom: eb.ref('geom_update'),
        geom_update: null,
      }))
      .where('geom_update', 'is', null)
      .where(sql<boolean>`NOT ST_IsEmpty(geom_update)`)
      .returning('id_fcu')
      .execute(),

    // Mises à jour (geom && geom_update)
    kdb
      .updateTable(config.tableName)
      .set((eb) => ({
        geom: eb.ref('geom_update'),
        geom_update: null,
      }))
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

  return {
    config,
    created: created.length,
    updated: updated.length,
    deleted: deleted.length,
    total: created.length + updated.length + deleted.length,
  };
};

export const applyGeometriesUpdates = async (context: ApiContext) => {
  const updateResults = await Promise.all(tables.map((table) => processTableGeometryUpdates(table)));

  // Récupère les statistiques
  const processed = updateResults.reduce<Record<string, { created: number; updated: number; deleted: number; total: number }>>(
    (acc, result) => {
      acc[result.config.internalName] = {
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        total: result.total,
      };
      return acc;
    },
    {}
  );

  const updatedEntities = updateResults.filter((result) => result.total > 0).map((result) => result.config.internalName);

  // Lance les jobs pour rafraichir les tuiles
  await Promise.all(updatedEntities.map((entityType) => createBuildTilesJob({ name: entityType }, context)));

  return {
    processed,
    jobsCreated: updatedEntities,
  };
};
