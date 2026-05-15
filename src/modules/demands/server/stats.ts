import type { Selectable } from 'kysely';

import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb, sql, type Users } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import type { FrontendType } from '@/utils/typescript';

type Stats = {
  total: number;
  pending: number;
};

/**
 * Retourne les statistiques de demandes par réseau : utilisateurs avec permissions, stats de demandes, relances, notes.
 */
export const getReseauxStats = async () => {
  const reseauxStats = await kdb
    .selectFrom(
      kdb
        .selectFrom('reseaux_de_chaleur')
        .select([
          'id_fcu',
          'nom_reseau',
          'Identifiant reseau',
          'notes',
          'puissance_totale_MW',
          sql<NetworkType>`'reseau_de_chaleur'`.as('network_type'),
        ])
        .unionAll(
          kdb.selectFrom('zones_et_reseaux_en_construction').select([
            'id_fcu',
            'nom_reseau',
            sql<string | null>`NULL`.as('Identifiant reseau'),
            'notes',
            // Les réseaux en construction n'ont pas de puissance renseignée
            sql<number | null>`NULL`.as('puissance_totale_MW'),
            sql<NetworkType>`'reseau_en_construction'`.as('network_type'),
          ])
        )
        .as('r')
    )
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom('demands')
          .select(
            sql
              .raw<{
                allTime: Stats;
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
          .whereRef('demands.network_id', '=', sql.ref('r.id_fcu'))
          .where('demands.network_type', '=', sql.ref<NetworkType>('r.network_type'))
          .where('demands.deleted_at', 'is', null)
          .as('demands_stats'),
      (join) => join.onTrue()
    )
    .select([
      'r.id_fcu',
      'r.nom_reseau',
      'r.Identifiant reseau',
      'r.network_type',
      'r.notes',
      'r.puissance_totale_MW',

      // Users with permissions on this network
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
            JOIN user_permissions up ON up.user_id = u.id
            WHERE up.resource_id = ${sql.ref('r.id_fcu')}::text
              AND up.type = ${sql.ref('r.network_type')}
              AND u.active IS TRUE
          ),
          '[]'::json
        )
      `.as('users'),

      // Reminders liées aux demandes (ordonnées de la plus récente)
      sql<{ id: string; author_email: string | null; note: string | null; created_at: string }[]>`
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', nr.id,
                'author_email', u.email,
                'note', nr.note,
                'created_at', nr.created_at
              )
              ORDER BY nr.created_at DESC
            )
            FROM network_reminders nr
            LEFT JOIN users u ON u.id = nr.author_id
            WHERE nr.network_id = ${sql.ref('r.id_fcu')}
              AND nr.network_type = ${sql.ref('r.network_type')}
              AND nr.type = 'demand'
          ),
          '[]'::json
        )
      `.as('reminders'),

      // Stats
      sql<Stats>`
        COALESCE(
          ${sql.ref('demands_stats.stats')}->'total',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('allTime'),
      sql<Stats>`
        COALESCE(
          ${sql.ref('demands_stats.stats')}->'lastThreeMonths',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('lastThreeMonths'),
      sql<Stats>`
        COALESCE(
          ${sql.ref('demands_stats.stats')}->'lastSixMonths',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('lastSixMonths'),
    ])
    .orderBy('r.nom_reseau', 'asc')
    .execute();

  return reseauxStats;
};

export type ReseauxStats = Awaited<ReturnType<typeof getReseauxStats>>[number];
