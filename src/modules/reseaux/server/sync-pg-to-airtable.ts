import { diff } from 'deep-object-diff';

import db from '@/server/db';
import base, { AirtableDB } from '@/server/db/airtable';
import { parentLogger } from '@/server/helpers/logger';
import { isEmptyObject, pick } from '@/utils/core';

import { convertAirtableValue } from './download-network';
import { tableConfigs } from './geometry-updates';

/**
 * Synchronise les tables postgres FCU vers Airtable.
 * Utilisé seulement pour certains champs : has_trace, is_zone, communes.
 */
export const syncPostgresToAirtable = async (dryRun: boolean) => {
  const startTime = Date.now();
  parentLogger.info('start postgres to airtable synchronization');

  for (const tableConfig of tableConfigs) {
    if (!tableConfig.airtable) {
      continue;
    }
    console.info(`\n\n# Synchronisation ${tableConfig.tableCible} -> ${tableConfig.airtable.tableName}`);

    const [postgresEntities, airtableEntities] = await Promise.all([
      db(tableConfig.tableCible)
        .select(
          'id_fcu',
          // réutilise la structure des changements pour simplifier un peu
          db.raw('communes as ign_communes'),
          db.raw('departement'),
          db.raw('region'),
          db.raw("st_geometrytype(geom) = 'ST_MultiLineString' as is_line"),
          ...(tableConfig.pgToAirtableSyncAdditionalFields ?? [])
        )
        .orderBy('id_fcu'),
      base(tableConfig.airtable.tableName).select().all(),
    ]);

    for (const postgresEntity of postgresEntities) {
      const airtableEntity = airtableEntities.find((airtableEntity) => airtableEntity.get('id_fcu') === postgresEntity.id_fcu);
      if (!airtableEntity) {
        console.error(`ERROR: entité airtable non trouvée pour l'ID FCU ${postgresEntity.id_fcu}`);
        continue;
      }

      const newAirtableValues = tableConfig.airtable.getUpdateProps(postgresEntity);
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
      if (!dryRun) await AirtableDB(tableConfig.airtable.tableName).update(airtableEntity.id, newAirtableValues);
    }
  }

  parentLogger.info('end postgres to airtable synchronization', {
    duration: Date.now() - startTime,
  });
};
