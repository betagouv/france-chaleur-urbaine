import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY_API }).base(
  process.env.AIRTABLE_BASE || ''
);

export default base;
