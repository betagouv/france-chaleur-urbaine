import { type Selectable, sql } from 'kysely';
import { limitFunction } from 'p-limit';
import { type Logger } from 'winston';

import { type Jobs, kdb } from '@/server/db/kysely';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { type APIAdresseResult, getAddressesCoordinates } from '@/server/services/api-adresse';
import { chunk } from '@/utils/array';
import { isDefined } from '@/utils/core';

export type ProEligibilityTestJob = Omit<Selectable<Jobs>, 'data'> & {
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

export async function processProEligibilityTestJob(job: ProEligibilityTestJob, logger: Logger) {
  const startTime = Date.now();
  const lines = job.data.csvContent
    .split('\n')
    .filter((line) => line) // remove empty lines
    .map((line) => (line.startsWith('"') ? line : `"${line}"`)); // only add quotes if not already quoted
  logger.info('infos', { addressesCount: lines.length });
  const addresses: APIAdresseResult[] = [];
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
            test_id: job.entity_id,
            source_address: addressItem.address,
            ban_valid: addressItem.result_status === 'ok',
            ban_address: addressItem.result_label,
            ban_score: isDefined(addressItem.result_score) ? Math.round(addressItem.result_score * 100) : null,
            geom: sql`st_transform(st_point(${addressItem.longitude}, ${addressItem.latitude}, 4326), 2154)`,
            eligibility_status: eligibilityStatus ?? undefined,
          } satisfies Parameters<ReturnType<typeof kdb.insertInto<'pro_eligibility_tests_addresses'>>['values']>[0];

          const existingAddressId = existingAddressesMap.get(addressItem.address);
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
