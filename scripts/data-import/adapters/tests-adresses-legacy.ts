import { limitFunction } from 'p-limit';

import { kdb, sql } from '@/server/db/kysely';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { type APIAdresseResult, getAddressesCoordinates } from '@/server/services/api-adresse';
import { chunk } from '@/utils/array';
import { isDefined } from '@/utils/core';

import { BaseAdapter } from '../base';

// Lower concurrency for DB operations to avoid pool exhaustion
const TEST_CONCURRENCY = 2;
const CHUNK_CONCURRENCY = 1;
const ADDRESS_CONCURRENCY = 10;
const BAN_ADDRESS_CONCURRENCY = 1000;

export default class TestsAdressesLegacyAdapter extends BaseAdapter {
  public name = 'tests-adresses-legacy';

  /**
   * This should be done only once, to migrate the data from the legacy database to the new one.
   * First, retrieve prod data with `pnpm db:pull:prod eligibility_tests eligibility_demands`
   * Then, import the data with `pnpm cli data:import tests-adresses-legacy`
   */
  async importData() {
    const eligibilityTests = await kdb
      .selectFrom('eligibility_tests')
      .leftJoin('eligibility_demands', 'eligibility_tests.id', 'eligibility_demands.eligibility_test_id')
      .where('eligibility_tests.status', '=', 'pending')
      .select(['eligibility_tests.id', 'eligibility_tests.result', 'eligibility_tests.addresses_count', 'eligibility_tests.file'])
      .orderBy('eligibility_tests.id', 'desc')
      .execute();

    this.logger.info(`Found ${eligibilityTests.length} eligibilityTests`);

    let addressesNotValid = 0;
    let processedAddresses = 0;

    // Parallelize the processing of eligibilityTests with pLimit (limitFunction)
    const testLimit = limitFunction(
      async ([index, { id, result, addresses_count, file }]: [number, (typeof eligibilityTests)[number]]) => {
        this.logger.info(`Processing eligibilityTest ${index + 1}/${eligibilityTests.length} (${id})`);

        let addresses: string[] = [];
        try {
          const fullAddresses = JSON.parse(result as string) as Array<{ address: string }>;
          addresses = [
            ...new Set(
              fullAddresses.map(({ address }: { address: string }) => {
                if (id === '3ad9dd04-222c-47cc-9059-f250a42e4869') {
                  const parts = address.split(';');
                  return `${parts[2]} ${parts[3]} ${parts[1]}`;
                }
                return address.trim().trimStart();
              })
            ),
          ];
        } catch (err) {
          this.logger.error('Error parsing addresses', { err });
          if (file === 'Not available' || !file) {
            this.logger.error(`No result for eligibilityTest ${id}`);
            addressesNotValid = addressesNotValid + (addresses_count || 0);
            // Use a transaction for DB updates
            await kdb.transaction().execute(async (trx) => {
              await trx.updateTable('eligibility_tests').set({ status: 'error' }).where('id', '=', id).execute();
            });
            return;
          }
        }
        this.logger.info(`Processing ${addresses.length} addresses / ${addresses_count}`);
        // Use a transaction for DB deletes and inserts
        await kdb.transaction().execute(async (trx) => {
          await trx.deleteFrom('eligibility_demands_addresses').where('test_id', '=', id).execute();

          const banAddresses: APIAdresseResult[] = [];

          // Use larger chunk size for fewer API calls
          const chunks = chunk(addresses, BAN_ADDRESS_CONCURRENCY);
          const totalChunks = chunks.length;

          // Parallelize chunk processing with higher concurrency
          const chunkLimit = limitFunction(
            async ([chunkIndex, chunk]: [number, string[]]) => {
              this.logger.info('processing chunk', {
                current: chunkIndex + 1,
                size: chunk.length,
                total: totalChunks,
                progress: `${Math.round(((chunkIndex + 1) / totalChunks) * 100)}%`,
              });
              const lines = chunk
                .filter((line) => line) // remove empty lines
                .map((line) => `"${line.replaceAll('"', ' ')}"`)
                .join('\n'); // add quotes to get a single column address

              const chunkResults = await getAddressesCoordinates(lines, this.logger);
              banAddresses.push(...chunkResults);
            },
            { concurrency: CHUNK_CONCURRENCY }
          );

          await Promise.all([...chunks.entries()].map(chunkLimit));

          // Batch insert for faster DB writes
          const addressRows: Parameters<ReturnType<typeof kdb.insertInto<'eligibility_demands_addresses'>>['values']>[0][] = [];

          // Parallelize eligibility status fetches with higher concurrency
          const processAddress = limitFunction(
            async (addressItem: (typeof banAddresses)[number]) => {
              const eligibilityStatus =
                addressItem.result_status === 'ok' ? await getEligilityStatus(addressItem.latitude, addressItem.longitude) : null;

              const addressData = {
                test_id: id as string,
                source_address: addressItem.address,
                ban_valid: addressItem.result_status === 'ok',
                ban_address: addressItem.result_label,
                ban_score: isDefined(addressItem.result_score) ? Math.round(addressItem.result_score * 100) : null,
                geom: sql`st_transform(st_point(${addressItem.longitude}, ${addressItem.latitude}, 4326), 2154)`,
                eligibility_status: eligibilityStatus ?? undefined,
              } satisfies Parameters<ReturnType<typeof kdb.insertInto<'eligibility_demands_addresses'>>['values']>[0];
              addressRows.push(addressData);
              processedAddresses = processedAddresses + 1;
            },
            { concurrency: ADDRESS_CONCURRENCY }
          );

          await Promise.all(banAddresses.map(processAddress));

          // Insert in bulk for better performance
          if (addressRows.length > 0) {
            // Insert in batches to avoid exceeding parameter limits
            const BATCH_SIZE = 100;
            for (let i = 0; i < addressRows.length; i += BATCH_SIZE) {
              await trx
                .insertInto('eligibility_demands_addresses')
                .values(addressRows.slice(i, i + BATCH_SIZE) as any)
                .execute();
            }
          }

          await trx.updateTable('eligibility_tests').set({ status: 'done' }).where('id', '=', id).execute();
        });
      },
      { concurrency: TEST_CONCURRENCY }
    );

    await Promise.all([...eligibilityTests.entries()].map(testLimit));

    this.logger.info(`Bypassed ${addressesNotValid} addresses`);
    this.logger.info(`Processed ${processedAddresses} addresses`);
  }
}
