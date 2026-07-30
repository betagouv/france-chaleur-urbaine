import { diff } from 'deep-object-diff';

import base, { AirtableDB } from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { isEmptyObject, pick } from '@/utils/core';

import { convertAirtableValue } from './download-network';
import { type Changement, tableConfigs } from './geometry-updates';

/**
 * Synchronise les tables postgres FCU vers Airtable (miroir en lecture côté Airtable).
 * Champs dérivés de la géométrie (has_trace, is_zone, communes, departement, region)
 * + champs admin FCU (nom_reseau, gestionnaire, MO, et Identifiant reseau pour chaleur/froid).
 * Déclenché par le job sync_geometries_to_airtable (après un « Sync » de géométries)
 * ou par la CLI sync-postgres-to-airtable — pas de cron.
 */
export const syncPostgresToAirtable = async (dryRun: boolean) => {
  const startTime = Date.now();
  parentLogger.info('start postgres to airtable synchronization');
  // Une erreur Airtable ne doit pas bloquer le reste du miroir : on continue et on agrège
  const updateErrors: string[] = [];

  for (const tableConfig of tableConfigs) {
    if (!tableConfig.airtable) {
      continue;
    }
    console.info(`\n\n# Synchronisation ${tableConfig.tableCible} -> ${tableConfig.airtable.tableName}`);

    const [postgresEntities, airtableEntities] = await Promise.all([
      kdb
        .selectFrom(tableConfig.tableCible as any)
        .select([
          'id_fcu',
          // réutilise la structure des changements pour simplifier un peu
          sql<string>`communes`.as('ign_communes'),
          sql<string>`departement`.as('departement'),
          sql<string>`region`.as('region'),
          sql<boolean>`st_geometrytype(geom) = 'ST_MultiLineString'`.as('is_line'),
          ...(tableConfig.pgToAirtableSyncAdditionalFields ?? []),
        ])
        .orderBy('id_fcu')
        .execute(),
      base(tableConfig.airtable.tableName).select().all(),
    ]);

    for (const postgresEntity of postgresEntities) {
      const airtableEntity = airtableEntities.find((airtableEntity) => airtableEntity.get('id_fcu') === postgresEntity.id_fcu);
      if (!airtableEntity) {
        console.error(`ERROR: entité airtable non trouvée pour l'ID FCU ${postgresEntity.id_fcu}`);
        continue;
      }

      const newAirtableValues = tableConfig.airtable.getUpdateProps(postgresEntity as unknown as Changement);
      const rawOldAirtableValues = pick(airtableEntity.fields, Object.keys(newAirtableValues));
      const oldAirtableValues = Object.entries(tableConfig.airtable.fieldsConversion).reduce((acc, [key, type]) => {
        acc[key] = convertAirtableValue(rawOldAirtableValues[key], type);
        return acc;
      }, {} as any);
      const objDiff = diff(oldAirtableValues, newAirtableValues);
      if (isEmptyObject(objDiff)) {
        continue;
      }

      console.info(
        `- ID FCU ${postgresEntity.id_fcu}: maj airtable ${JSON.stringify(objDiff)} (anciennement ${JSON.stringify(
          pick(oldAirtableValues, Object.keys(objDiff))
        )})`
      );
      if (!dryRun) {
        try {
          await AirtableDB(tableConfig.airtable.tableName).update(airtableEntity.id, newAirtableValues);
        } catch (error) {
          const message = `${tableConfig.airtable.tableName} — ID FCU ${postgresEntity.id_fcu}: ${error instanceof Error ? error.message : error}`;
          console.error(`ERROR: échec de la mise à jour ${message}`);
          updateErrors.push(message);
        }
      }
    }
  }

  parentLogger.info('end postgres to airtable synchronization', {
    duration: Date.now() - startTime,
    errors: updateErrors.length,
  });
  // Relance en fin de run pour que le job apparaisse en erreur, une fois tout le reste poussé
  if (updateErrors.length > 0) {
    throw new Error(
      `${updateErrors.length} mise(s) à jour Airtable en échec : ${updateErrors.slice(0, 5).join(' ; ')}${updateErrors.length > 5 ? ' ; …' : ''}`
    );
  }
};
