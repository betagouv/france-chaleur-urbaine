import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // On ajoute une colonne custom pour précalculer la géométrie réduite.
  // Ça permet d'éviter d'avoir à faire ces calculs dans les requêtes donc ⚡
  // Là ça va juste mettre 5-10min à tourner. (et potentiellement mettre en pause quelques requêtes mais c'est acceptable)
  await knex.raw(`
    ALTER TABLE public.ign_communes ADD COLUMN geom_150m geometry(MultiPolygon,2154);
    UPDATE public.ign_communes SET geom_150m = st_buffer(geom, -150);
    CREATE INDEX IF NOT EXISTS ign_communes_geom_150m_idx ON public.ign_communes USING gist(geom_150m);
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
