import { sql } from 'kysely';
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import base from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { Airtable } from '@/types/enum/Airtable';
import type { Demand } from '@/types/Summary/Demand';
import { processInParallel } from '@/utils/async';

export const importDemands = async (options: { batchSize?: string; dryRun?: boolean }) => {
  const concurrency = parseInt(options.batchSize || '100', 10);
  const dryRun = options.dryRun || false;

  console.log(`Starting demands migration from Airtable (concurrency: ${concurrency}, dry-run: ${dryRun})...`);

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

        const airtableLegacyValues: AirtableLegacyRecord = {
          ...fields,
        };

        if (dryRun) {
          processed++;
          return;
        }

        // Check if record already exists
        const existing = await kdb.selectFrom('demands').selectAll().where(sql`legacy_values->>'id'`, '=', airtableId).executeTakeFirst();

        const demandData = {
          airtable_id: airtableId,
          legacy_values: airtableLegacyValues as any,
        };

        if (existing) {
          await kdb.updateTable('demands').set(demandData).where(sql`legacy_values->>'id'`, '=', airtableId).execute();

          updated++;
        } else {
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

    console.log('\nDemands migration completed!');
    console.log(`Total records: ${records.length}`);
    console.log(`Processed: ${processed}`);
    if (!dryRun) {
      console.log(`Inserted: ${inserted}`);
      console.log(`Updated: ${updated}`);
    }
    console.log(`Errors: ${errors}`);

    return { errors, inserted, processed, updated };
  } catch (error) {
    console.error('Demands migration failed:', error);
    throw error;
  }
};

export const importDemandEmails = async (options: { batchSize?: string; dryRun?: boolean }) => {
  const concurrency = parseInt(options.batchSize || '100', 10);
  const dryRun = options.dryRun || false;

  console.log(`Starting demand emails migration from Airtable (concurrency: ${concurrency}, dry-run: ${dryRun})...`);

  try {
    // Fetch all email records from Airtable
    const records = await base(Airtable.UTILISATEURS_EMAILS).select().all();
    console.log(`Found ${records.length} email records in Airtable`);

    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    let skipped = 0;

    // Process records in parallel with concurrency control
    await processInParallel(records, concurrency, async (record) => {
      try {
        const airtableId = record.id;
        const fields = record.fields;

        if (dryRun) {
          processed++;
          return;
        }

        // Find the corresponding demand in PostgreSQL
        const demand = await kdb.selectFrom('demands').select('id').where('airtable_id', '=', fields.demand_id).executeTakeFirst();

        if (!demand) {
          console.warn(`Demand ${fields.demand_id} not found for email ${airtableId}, skipping`);

          skipped++;
          processed++;
          return;
        }

        // Check if email already exists
        const existing = await kdb.selectFrom('demand_emails').selectAll().where('airtable_id', '=', airtableId).executeTakeFirst();

        const emailData = {
          airtable_id: airtableId,
          body: fields.body || '',
          cc: fields.cc || '',
          demand_id: demand.id,
          email_key: fields.email_key || '',
          object: fields.object || '',
          reply_to: fields.reply_to || fields.replyTo || '',
          signature: fields.signature || '',
          to: fields.to || '',
          user_email: fields.user_email || '',
        };

        if (existing) {
          await kdb.updateTable('demand_emails').set(emailData).where('airtable_id', '=', airtableId).execute();

          updated++;
        } else {
          // await kdb
          //   .insertInto('demand_emails')
          //   .values(emailData as any)
          //   .execute();

          inserted++;
        }

        processed++;

        // Log progress every 100 records
        if (processed % 100 === 0) {
          const progress = Math.round((processed / records.length) * 100);
          console.log(
            `Progress: ${processed}/${records.length} (${progress}%) - Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`
          );
        }
      } catch (error) {
        console.error(`Error processing email ${record.id}:`, error);
        errors++;
        processed++;
      }
    });

    console.log('\nDemand emails migration completed!');
    console.log(`Total records: ${records.length}`);
    console.log(`Processed: ${processed}`);
    if (!dryRun) {
      console.log(`Inserted: ${inserted}`);
      console.log(`Updated: ${updated}`);
      console.log(`Skipped: ${skipped}`);
    }
    console.log(`Errors: ${errors}`);

    return { errors, inserted, processed, skipped, updated };
  } catch (error) {
    console.error('Demand emails migration failed:', error);
    throw error;
  }
};

export default async (options: { batchSize?: string; dryRun?: boolean }) => {
  console.log('Starting full migration from Airtable...\n');

  const demandsResult = await importDemands(options);
  console.log('\n---\n');
  const emailsResult = await importDemandEmails(options);

  console.log('\n=== Migration Summary ===');
  console.log('Demands:', demandsResult);
  console.log('Emails:', emailsResult);
};
