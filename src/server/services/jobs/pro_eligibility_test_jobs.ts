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
      // on supprime toutes les adresses si le job a déjà été traité
      await trx.deleteFrom('pro_eligibility_tests_addresses').where('test_id', '=', job.entity_id).execute();

      const processAddress = limitFunction(
        async (addressItem: (typeof addresses)[number]) => {
          const eligibilityStatus =
            addressItem.result_status === 'ok' ? await getEligilityStatus(addressItem.latitude, addressItem.longitude) : null;
          await trx
            .insertInto('pro_eligibility_tests_addresses')
            .values({
              test_id: job.entity_id,
              source_address: addressItem.address,
              ban_valid: addressItem.result_status === 'ok',
              ban_address: addressItem.result_label,
              ban_score: isDefined(addressItem.result_score) ? Math.round(addressItem.result_score * 100) : null, // 0.9733 => 97
              geom: sql`st_transform(st_point(${addressItem.longitude}, ${addressItem.latitude}, 4326), 2154)`,
              eligibility_status: eligibilityStatus ?? undefined,
            })
            .executeTakeFirst();
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
