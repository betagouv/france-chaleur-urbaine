import { sql, type Selectable } from 'kysely';
import { type Logger } from 'winston';

import { kdb, type Jobs } from '@/server/db/kysely';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { getAddressesCoordinates } from '@/server/services/api-adresse';
import { processInParallel } from '@/types/async';

export type ProEligibilityTestJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'pro_eligibility_test';
  data: {
    csvContent: string;
  };
};

export async function processProEligibilityTestJob(job: ProEligibilityTestJob, logger: Logger) {
  const startTime = Date.now();
  const results = await getAddressesCoordinates(job.data.csvContent);
  logger.info('API BAN', { duration: Date.now() - startTime });

  {
    const startTime = Date.now();
    await kdb.transaction().execute(async (trx) => {
      // on supprime toutes les adresses si le job a déjà été traité
      await trx.deleteFrom('pro_eligibility_tests_addresses').where('test_id', '=', job.entity_id).execute();

      await processInParallel(results, 20, async (addressItem) => {
        const eligibilityStatus =
          addressItem.result_status === 'ok' ? await getEligilityStatus(addressItem.latitude, addressItem.longitude) : null;
        await trx
          .insertInto('pro_eligibility_tests_addresses')
          .values({
            test_id: job.entity_id,
            source_address: addressItem.address,
            ban_valid: addressItem.result_status === 'ok',
            ban_address: addressItem.result_label ?? '',
            ban_score: Math.round((addressItem.result_score ?? 0) * 100), // 0.9733 => 97
            geom: sql`st_transform(st_point(${addressItem.longitude}, ${addressItem.latitude}, 4326), 2154)`,
            eligibility_status: eligibilityStatus ?? undefined,
          })
          .executeTakeFirst();
      });
    });
    logger.info('test éligibilité', { duration: Date.now() - startTime });
  }

  return {
    duration: Date.now() - startTime,
  };
}
