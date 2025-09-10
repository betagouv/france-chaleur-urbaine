import { type Selectable, sql } from 'kysely';
import { limitFunction } from 'p-limit';
import Papa from 'papaparse';
import { type Logger } from 'winston';

import { type Jobs, kdb } from '@/server/db/kysely';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { type APIAdresseResult, getAddressesCoordinates, getCoordinatesAddresses } from '@/server/services/api-adresse';
import { chunk } from '@/utils/array';
import { isDefined } from '@/utils/core';

export type ProEligibilityTestJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'pro_eligibility_test';
  data: {
    content: string;
    hasHeaders: boolean;
    separator: string;
    dataType: 'address' | 'coordinates';
    columnMapping: {
      addressColumn?: number;
      latitudeColumn?: number;
      longitudeColumn?: number;
    };
  };
};
export type ProEligibilityTestJobDeprecated = Omit<Selectable<Jobs>, 'data'> & {
  type: 'pro_eligibility_test';
  data: {
    csvContent: string;
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
  let { content, separator, dataType, hasHeaders, columnMapping } = job.data;

  if (isProEligibilityTestJobDeprecated(job)) {
    content = job.data.csvContent;
    columnMapping = { addressColumn: 0 };
    dataType = 'address';
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
  const lines = job.data.content
    .replace(/\r\n/g, '\n')
    .replace(/"/g, '')
    .split('\n')
    .filter((line) => line) // remove empty lines
    .map((line) => `"${line}"`); // add quotes to get a single column address
  logger.info('infos', { addressesCount: lines.length });

  const addresses: APIAdresseResult[] = [];

  if (dataType === 'address') {
    const chunks = chunk(lines, chunkSize);
    const totalChunks = chunks.length;
    for (const [index, chunk] of chunks.entries()) {
      logger.info('processing chunk', {
        current: index + 1,
        size: chunk.length,
        total: totalChunks,
        progress: `${Math.round(((index + 1) / totalChunks) * 100)}%`,
      });
      const chunkResults = await getAddressesCoordinates(chunk.join('\n'), logger);
      addresses.push(...chunkResults);
    }
    logger.info('API Adresse', { duration: Date.now() - startTime });
  } else if (dataType === 'coordinates') {
    const coordinateLines = rows.map((row) => {
      const latitude = Number(row[columnMapping.latitudeColumn!]);
      const longitude = Number(row[columnMapping.longitudeColumn!]);
      return `${latitude},${longitude}`;
    });

    const chunks = chunk(coordinateLines, chunkSize);
    const totalChunks = chunks.length;
    for (const [index, chunk] of chunks.entries()) {
      logger.info('processing chunk', {
        current: index + 1,
        size: chunk.length,
        total: totalChunks,
        progress: `${Math.round(((index + 1) / totalChunks) * 100)}%`,
      });
      const chunkResults = await getCoordinatesAddresses(chunk.join('\n'), logger);
      addresses.push(...chunkResults);
    }
    logger.info('API Adresse reverse geocoding', { duration: Date.now() - startTime });
  }
  const jobStats: JobStats = {
    updatedCount: 0,
    insertedCount: 0,
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
          const eligibilityStatus =
            addressItem.result_status === 'ok' ? await getEligilityStatus(addressItem.latitude, addressItem.longitude) : null;

          const addressData = {
            test_id: job.entity_id!,
            source_address: addressItem.address as string,
            ban_valid: addressItem.result_status === 'ok',
            ban_address: addressItem.result_label,
            ban_score: isDefined(addressItem.result_score) ? Math.round(addressItem.result_score * 100) : null,
            geom: sql`st_transform(st_point(${addressItem.longitude}, ${addressItem.latitude}, 4326), 2154)`,
            eligibility_status: eligibilityStatus ?? undefined,
          } satisfies Parameters<ReturnType<typeof kdb.insertInto<'pro_eligibility_tests_addresses'>>['values']>[0];

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
              total: totalAddresses,
              progress: `${Math.round((processedCount / totalAddresses) * 100)}%`,
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

  return {
    stats: jobStats,
  };
}
