import { sql, type Selectable } from 'kysely';
import { limitFunction } from 'p-limit';
import { type Logger } from 'winston';

import { kdb, type Jobs } from '@/server/db/kysely';
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

const chunkSize = 1000;

export async function processProEligibilityTestJob(job: ProEligibilityTestJob, logger: Logger) {
  const startTime = Date.now();

  const lines = job.data.csvContent.split('\n');
  const addresses: APIAdresseResult[] = [];
  const chunks = chunk(lines, chunkSize);
  for (const chunk of chunks.values()) {
    const chunkResults = await getAddressesCoordinates(chunk.join('\n'));
    // console.log('BAN results', chunkResults);
    addresses.push(...chunkResults);
  }
  logger.info('API BAN', { duration: Date.now() - startTime });

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
            geom: sql<string>`st_transform(st_point(${addressItem.longitude}, ${addressItem.latitude}, 4326), 2154)`,
            eligibility_status: eligibilityStatus ?? undefined,
          } satisfies Parameters<ReturnType<typeof kdb.insertInto<'pro_eligibility_tests_addresses'>>['values']>[0];

          const existingAddressId = existingAddressesMap.get(addressItem.address);
          if (existingAddressId) {
            await trx.updateTable('pro_eligibility_tests_addresses').set(addressData).where('id', '=', existingAddressId).execute();
          } else {
            await trx.insertInto('pro_eligibility_tests_addresses').values(addressData).execute();
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
    duration: Date.now() - startTime,
  };
}
