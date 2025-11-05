import { sql } from 'kysely';
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import base from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { Airtable } from '@/types/enum/Airtable';
import type { Demand } from '@/types/Summary/Demand';
import { processInParallel } from '@/utils/async';

export default async (options: { batchSize?: string; dryRun?: boolean }) => {
  const concurrency = parseInt(options.batchSize || '100', 10);
  const dryRun = options.dryRun || false;

  console.log(`Starting migration from Airtable (concurrency: ${concurrency}, dry-run: ${dryRun})...`);

  try {
    // Fetch all records from Airtable
    const records = await base(Airtable.DEMANDES).select().all();
    console.log(`Found ${records.length} records in Airtable`);

    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // Process records in parallel with concurrency control
    await processInParallel(records, concurrency, async (record) => {
      try {
        const airtableId = record.id;
        const fields = record.fields as Demand;

        // Include the id inside the airtable_legacy_values for cleaner encapsulation
        const airtableLegacyValues: AirtableLegacyRecord = {
          ...fields,
        };

        if (dryRun) {
          processed++;
          return;
        }

        // Check if record already exists
        const existing = await kdb
          .selectFrom('demands')
          .selectAll()
          .where(sql`airtable_legacy_values->>'id'`, '=', airtableId)
          .executeTakeFirst();

        const demandData = {
          airtable_legacy_values: airtableLegacyValues as any,
        };

        if (existing) {
          // Update existing record
          await kdb.updateTable('demands').set(demandData).where(sql`airtable_legacy_values->>'id'`, '=', airtableId).execute();

          updated++;
        } else {
          // Insert new record
          await kdb
            .insertInto('demands')
            .values(demandData as any)
            .execute();

          inserted++;
        }

        processed++;

        // Log progress every 100 records
        if (processed % 100 === 0) {
          const progress = Math.round((processed / records.length) * 100);
          console.log(
            `Progress: ${processed}/${records.length} (${progress}%) - Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`
          );
        }
      } catch (error) {
        console.error(`Error processing record ${record.id}:`, error);
        errors++;
        processed++;
      }
    });

    console.log('\nMigration completed!');
    console.log(`Total records: ${records.length}`);
    console.log(`Processed: ${processed}`);
    if (!dryRun) {
      console.log(`Inserted: ${inserted}`);
      console.log(`Updated: ${updated}`);
    }
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
