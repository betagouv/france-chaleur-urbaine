import { type Selectable, sql } from 'kysely';
import { limitFunction } from 'p-limit';
import Papa from 'papaparse';
import type { Logger } from 'winston';

import type { BoundingBox } from '@/modules/geo/types';
import { createBuildTilesJob } from '@/modules/tiles/server/service';
import { type Jobs, kdb } from '@/server/db/kysely';
import { type APIAdresseResult, getAddressesCoordinates, getCoordinatesAddresses } from '@/server/services/api-adresse';
import { chunk } from '@/utils/array';
import { processInParallel } from '@/utils/async';

import type { ProEligibilityTestHistoryEntry } from '../types';
import { createAddressDataFromBAN, getAddressEligibilityHistoryEntry } from './service';

export type ProEligibilityTestJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'pro_eligibility_test';
  data: {
    content: string;
    hasHeaders: boolean;
    separator: string;
  } & (
    | {
        dataType: 'address';
        columnMapping: {
          addressColumn: number;
        };
      }
    | {
        dataType: 'coordinates';
        columnMapping: {
          latitudeColumn: number;
          longitudeColumn: number;
        };
      }
  );
};
export type ProEligibilityTestJobDeprecated = Omit<Selectable<Jobs>, 'data'> & {
  type: 'pro_eligibility_test';
  data: {
    csvContent: string;
  };
};

export type WarnEligibilityChangesJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'pro_eligibility_test_notify_changes';
  data: {
    bboxes: BoundingBox[];
  };
};

type JobStats = {
  updatedCount: number;
  insertedCount: number;
};

const chunkSize = 1000;

function isProEligibilityTestJobDeprecated(job: any): job is ProEligibilityTestJobDeprecated {
  return !!job.data.csvContent;
}

export async function processProEligibilityTestJob(job: ProEligibilityTestJob, logger: Logger) {
  const startTime = Date.now();
  let { content, separator, hasHeaders } = job.data;
  const jobData = job.data;

  if (isProEligibilityTestJobDeprecated(job)) {
    content = job.data.csvContent;
    jobData.columnMapping = { addressColumn: 0 };
    jobData.dataType = 'address';
    separator = '\x00'; /* Null character. Unlikely to appear in a CSV file */
    hasHeaders = false;
  }

  const papaResult = Papa.parse<string[]>(content, {
    delimiter: separator || '', // auto-detect
    skipEmptyLines: true,
  });

  if (!papaResult.data || papaResult.data.length === 0) {
    throw new Error('Empty or invalid CSV file');
  }

  // PapaParse may return rows as arrays or objects, but we want arrays
  const rows: string[][] = papaResult.data as string[][];
  if (rows.length === 0) {
    throw new Error('Could not parse CSV data');
  }

  if (hasHeaders) {
    rows.shift(); // remove headers
  }

  logger.info('infos', { dataType: jobData.dataType, rowsCount: rows.length });

  const formattedRows =
    jobData.dataType === 'address'
      ? rows
          .map((row) => row[jobData.columnMapping.addressColumn]?.trim())
          .filter((address) => address)
          .map((address) => `"${address.replace(/"/g, '')}"`)
      : rows
          .filter((row) => row[jobData.columnMapping.latitudeColumn] && row[jobData.columnMapping.longitudeColumn])
          .map((row) => `${row[jobData.columnMapping.latitudeColumn]},${row[jobData.columnMapping.longitudeColumn]}`);
  const chunkProcessorFunction = jobData.dataType === 'address' ? getAddressesCoordinates : getCoordinatesAddresses;

  const chunks = chunk(formattedRows, chunkSize);
  const totalChunks = chunks.length;
  const addresses: APIAdresseResult[] = [];

  for (const [index, chunkItems] of chunks.entries()) {
    logger.info('processing chunk', {
      current: index + 1,
      progress: `${Math.round(((index + 1) / totalChunks) * 100)}%`,
      size: chunkItems.length,
      total: totalChunks,
    });
    const chunkResults = await chunkProcessorFunction(chunkItems.join('\n'));
    addresses.push(...chunkResults);
  }
  logger.info('API Adresse', { duration: Date.now() - startTime });

  const jobStats: JobStats = {
    insertedCount: 0,
    updatedCount: 0,
  };
  {
    const startTime = Date.now();
    await kdb.transaction().execute(async (trx) => {
      // Get existing addresses for this test
      const existingAddresses = await trx
        .selectFrom('pro_eligibility_tests_addresses')
        .select(['source_address', 'id'])
        .where('test_id', '=', job.entity_id)
        .execute();

      const existingAddressesMap = new Map(existingAddresses.map((a) => [a.source_address, a.id]));

      let processedCount = 0;
      const totalAddresses = addresses.length;

      const processAddress = limitFunction(
        async (addressItem: (typeof addresses)[number]) => {
          const addressData = await createAddressDataFromBAN(addressItem, {
            test_id: job.entity_id!,
          });

          const existingAddressId = existingAddressesMap.get(addressItem.address as string);
          if (existingAddressId) {
            await trx.updateTable('pro_eligibility_tests_addresses').set(addressData).where('id', '=', existingAddressId).execute();
            jobStats.updatedCount++;
          } else {
            await trx.insertInto('pro_eligibility_tests_addresses').values(addressData).execute();
            jobStats.insertedCount++;
          }

          processedCount++;
          if (processedCount % 100 === 0) {
            logger.info('processing addresses', {
              processed: processedCount,
              progress: `${Math.round((processedCount / totalAddresses) * 100)}%`,
              total: totalAddresses,
            });
          }
        },
        { concurrency: 20 }
      );

      await Promise.all(addresses.map((addressItem) => processAddress(addressItem)));
    });
    logger.info('test éligibilité', { duration: Date.now() - startTime });
  }

  await kdb
    .updateTable('pro_eligibility_tests')
    .where('id', '=', job.entity_id)
    .set({
      has_unseen_results: true,
      updated_at: new Date(),
    })
    .execute();

  // Create build_tiles job now that eligibility has been calculated for all addresses
  // This ensures tiles are built with complete eligibility data
  logger.info('Creating build_tiles job after eligibility calculation');
  await createBuildTilesJob({ name: 'tests-adresses' }, job.user_id ? ({ user: { id: job.user_id } } as any) : undefined, {
    replace: true,
  });

  return {
    stats: jobStats,
  };
}

type WarnEligibilityChangesJobStats = {
  addressesChecked: number;
  addressesChanged: number;
  testsUpdated: number;
};

/**
 * Traite un job de vérification des changements d'éligibilité
 * Pour chaque bbox affectée, vérifie toutes les adresses de tests et met à jour l'historique si changement
 */
export async function processWarnEligibilityChangesJob(job: WarnEligibilityChangesJob, logger: Logger) {
  const startTime = Date.now();
  const { bboxes } = job.data;

  logger.info('Starting eligibility check', { bboxCount: bboxes.length });

  const stats: WarnEligibilityChangesJobStats = {
    addressesChanged: 0,
    addressesChecked: 0,
    testsUpdated: 0,
  };

  const query = kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .select([
      'id',
      sql<GeoJSON.Point>`ST_AsGeoJSON(ST_Transform(geom, 4326))::json`.as('geom'),
      'eligibility_history',
      'ban_address',
      'ban_score',
      'test_id',
    ])

    .where(
      sql<boolean>`st_within(
      geom,
      ST_Transform(
        ST_Union(ARRAY[${sql.join(
          bboxes.map((bbox) => sql`ST_MakeEnvelope(${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, 4326)`)
        )}]::geometry[]),
        2154
      )
    )`
    )
    .where('ban_address', 'is not', null)
    .where('ban_score', '>', 60);

  // Trouve toutes les adresses qui intersectent avec au moins une des bboxes
  // Utilise un tableau de géométries avec l'opérateur && (bounding box overlap)
  // Les bboxes sont en WGS84 (4326) et doivent être transformées en Lambert 93 (2154)
  const addressesToCheck = await query.execute();

  logger.info(`Found ${addressesToCheck.length} addresses in all bboxes`, { count: addressesToCheck.length });

  // Vérifie chaque adresse en parallèle
  await processInParallel(addressesToCheck, 10, async (address) => {
    stats.addressesChecked++;

    // Récupère l'historique existant
    const existingHistory = (address.eligibility_history as ProEligibilityTestHistoryEntry[]) || [];
    const lastEntry = existingHistory[existingHistory.length - 1];

    // Calcule la nouvelle entrée d'historique
    const newHistoryEntry = await getAddressEligibilityHistoryEntry(
      address.geom.coordinates[1],
      address.geom.coordinates[0],
      lastEntry?.eligibility
    );

    if (newHistoryEntry.transition !== 'none') {
      stats.addressesChanged++;

      const updatedHistory = [...existingHistory, newHistoryEntry];

      // Met à jour l'adresse
      await kdb
        .updateTable('pro_eligibility_tests_addresses')
        .set({ eligibility_history: JSON.stringify(updatedHistory) })
        .where('id', '=', address.id)
        .execute();

      // Marque le test parent comme ayant des changements
      await kdb.updateTable('pro_eligibility_tests').set({ has_unseen_changes: true }).where('id', '=', address.test_id).execute();

      logger.info('Eligibility changed', {
        addressId: address.id,
        transition: newHistoryEntry.transition,
      });
    }
  });
  // Compte le nombre de tests mis à jour
  const testsWithChanges = await kdb
    .selectFrom('pro_eligibility_tests')
    .select(kdb.fn.countAll<number>().as('count'))
    .where('has_unseen_changes', '=', true)
    .executeTakeFirstOrThrow();

  stats.testsUpdated = testsWithChanges.count;

  const duration = Date.now() - startTime;
  logger.info('Eligibility check completed', {
    addressesChanged: stats.addressesChanged,
    addressesChecked: stats.addressesChecked,
    duration,
    testsUpdated: stats.testsUpdated,
  });

  return {
    stats,
  };
}
