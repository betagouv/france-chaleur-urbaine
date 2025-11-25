import type { Selectable } from 'kysely';
import { kdb, type ReseauxDeChaleur, sql, type Users, type ZonesEtReseauxEnConstruction } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import type { FrontendType } from '@/utils/typescript';

type Stats = {
  total: number;
  pending: number;
};

/**
 * Retourne les informations et stats par tags de gestionnaires : utilisateurs, réseaux, stats de demandes des derniers mois.
 */
export const getTagsStats = async () => {
  const tagsStats = await kdb
    .with('reseaux_par_tag', (eb) =>
      eb
        .selectFrom('reseaux_de_chaleur')
        .select((eb) => [
          eb.fn('unnest', [eb.ref('tags')]).as('tag'),
          sql`
            json_agg(
              json_build_object(
                'id_fcu', id_fcu,
                'Identifiant reseau', "Identifiant reseau",
                'nom_reseau', nom_reseau
              )
            )
          `.as('json'),
        ])
        .groupBy(['tag'])
    )
    .with('reseaux_construction_par_tag', (eb) =>
      eb
        .selectFrom('zones_et_reseaux_en_construction')
        .select((eb) => [
          eb.fn('unnest', [eb.ref('tags')]).as('tag'),
          sql`
            json_agg(
              json_build_object(
                'id_fcu', id_fcu,
                'nom_reseau', nom_reseau,
                'is_zone', is_zone
              )
            )
          `.as('json'),
        ])
        .groupBy(['tag'])
    )
    .selectFrom('tags as t')
    .leftJoin('reseaux_par_tag as r', (join) => join.onRef('r.tag', '=', 't.name'))
    .leftJoin('reseaux_construction_par_tag as rc', (join) => join.onRef('rc.tag', '=', 't.name'))
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom('demands')
          .select(
            sql
              .raw<{
                total: Stats;
                lastThreeMonths: Stats;
                lastSixMonths: Stats;
              }>(`
                jsonb_build_object(
                  'total', jsonb_build_object(
                    'total', COUNT(*),
                    'pending', COUNT(*) FILTER (
                      WHERE COALESCE(legacy_values->>'Status', '${DEMANDE_STATUS.EMPTY}') = '${DEMANDE_STATUS.EMPTY}'
                        AND COALESCE((legacy_values->>'Prise de contact')::boolean, false) = false
                    )
                  ),
                  'lastThreeMonths', jsonb_build_object(
                    'total', COUNT(*) FILTER (WHERE (legacy_values->>'Date de la demande')::date >= NOW() - INTERVAL '3 months'),
                    'pending', COUNT(*) FILTER (
                      WHERE (legacy_values->>'Date de la demande')::date >= NOW() - INTERVAL '3 months'
                        AND COALESCE(legacy_values->>'Status', '${DEMANDE_STATUS.EMPTY}') = '${DEMANDE_STATUS.EMPTY}'
                        AND COALESCE((legacy_values->>'Prise de contact')::boolean, false) = false
                    )
                  ),
                  'lastSixMonths', jsonb_build_object(
                    'total', COUNT(*) FILTER (WHERE (legacy_values->>'Date de la demande')::date >= NOW() - INTERVAL '6 months'),
                    'pending', COUNT(*) FILTER (
                      WHERE (legacy_values->>'Date de la demande')::date >= NOW() - INTERVAL '6 months'
                        AND COALESCE(legacy_values->>'Status', '${DEMANDE_STATUS.EMPTY}') = '${DEMANDE_STATUS.EMPTY}'
                        AND COALESCE((legacy_values->>'Prise de contact')::boolean, false) = false
                    )
                  )
                )
              `)
              .as('stats')
          )
          .where(sql`${sql.ref('legacy_values')}->'Gestionnaires'`, '@>', sql`jsonb_build_array(${sql.ref('t.name')})`)
          .as('demands_stats'),
      (join) => join.onTrue()
    )
    .select((eb) => [
      'id',
      'name',
      'type',

      // Users
      sql<FrontendType<Selectable<Pick<Users, 'id' | 'email' | 'last_connection'>>>[]>`
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', u.id,
                'email', u.email,
                'last_connection', u.last_connection
              )
              ORDER BY u.last_connection DESC NULLS LAST
            )
            FROM users u
            WHERE ${sql.ref('t.name')} = ANY(u.gestionnaires)
              AND u.email IS NOT NULL
              AND u.active IS TRUE
          ),
          '[]'::json
        )
      `.as('users'),

      // Réseaux
      sql<Pick<ReseauxDeChaleur, 'id_fcu' | 'Identifiant reseau' | 'nom_reseau'>[]>`COALESCE(${eb.ref('r.json')}, '[]'::json)`.as(
        'reseauxDeChaleur'
      ),
      sql<Pick<ZonesEtReseauxEnConstruction, 'id_fcu' | 'nom_reseau' | 'is_zone'>[]>`
        COALESCE(${eb.ref('rc.json')}, '[]'::json)
      `.as('reseauxEnConstruction'),

      // Stats des demandes
      sql<Stats>`
        COALESCE(
          ${eb.ref('demands_stats.stats')}->'total',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('allTime'),
      sql<Stats>`
        COALESCE(
          ${eb.ref('demands_stats.stats')}->'lastThreeMonths',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('lastThreeMonths'),
      sql<Stats>`
        COALESCE(
          ${eb.ref('demands_stats.stats')}->'lastSixMonths',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('lastSixMonths'),
    ])
    .orderBy('t.name')
    .execute();

  return tagsStats;
};

export type TagsStats = Awaited<ReturnType<typeof getTagsStats>>[number];
