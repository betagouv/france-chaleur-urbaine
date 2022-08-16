import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY_API }).base(
  process.env.AIRTABLE_BASE || ''
);

export default base;
