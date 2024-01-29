import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await Promise.all(
    ['reseaux_de_chaleur', 'reseaux_de_froid'].map(async (tableName) => {
      await knex.schema.alterTable(tableName, (table) => {
        table.string('informationsComplementaires', 255);
        table.jsonb('fichiers');
      });
      await knex(tableName).update({
        informationsComplementaires: '',
        fichiers: '[]',
      });
      await knex.schema.alterTable(tableName, (table) => {
        table.dropNullable('informationsComplementaires');
        table.dropNullable('fichiers');
      });
    })
  );
}

export async function down(knex: Knex): Promise<void> {
  ['reseaux_de_chaleur', 'reseaux_de_froid'].map(async (tableName) => {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumns('informationsComplementaires', 'fichiers');
    });
  });
}
