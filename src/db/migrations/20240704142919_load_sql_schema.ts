import { Knex } from "knex";

const fs = require('fs');
const path = require('path');

export async function up(knex: Knex): Promise<void> {
  const sqlPath = path.join(__dirname, 'initial_schema_import.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  return knex.raw(sql);
}

export async function down(knex: Knex): Promise<void> {
  throw new Error("this initial migration cannot be rolled back");
}
