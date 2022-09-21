import Airtable from 'airtable';
import dotenv from 'dotenv';

export type { FieldSet } from 'airtable';
export type { QueryParams } from 'airtable/lib/query_params';

dotenv.config({ path: '.env.local' });
dotenv.config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY_API }).base(
  process.env.AIRTABLE_BASE || ''
);

export default base;
