import dayjs from 'dayjs';
import { kdb, sql } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

type PeriodStats = {
  pending: number;
  total: number;
};

const parseDate = (value: unknown): dayjs.Dayjs | null => {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const date = dayjs(value);
    return date.isValid() ? date : null;
  }
  return null;
};

/**
 * Calcule les statistiques pour une période donnée.
 * Utilise reduce pour compter les demandes en attente de manière fonctionnelle.
 */
const calculatePeriodStats = (
  demands: Array<{ Status?: string; 'Date demandes'?: unknown; 'Date de la demande'?: unknown }>,
  periodStart: dayjs.Dayjs
): PeriodStats => {
  const total = demands.length;

  const pending = demands.reduce((count, demand) => {
    const status = demand.Status || DEMANDE_STATUS.EMPTY;
    if (status !== DEMANDE_STATUS.EMPTY) return count;

    const dateDemande = parseDate(demand['Date demandes'] || demand['Date de la demande']);
    if (!dateDemande) return count;

    return dateDemande.isAfter(periodStart) || dateDemande.isSame(periodStart) ? count + 1 : count;
  }, 0);

  return { pending, total };
};

export const getTagsStats = async () => {
  // Récupère tous les tags avec leurs utilisateurs
  const tagsWithUsers = await kdb
    .selectFrom('tags as t')
    .leftJoin('users as u', (join) => join.on(sql.ref('t.name'), '=', sql`ANY(${sql.ref('u.gestionnaires')})`))
    .select([
      't.id',
      't.name',
      't.type',
      sql
        .raw<Array<{ id: number; email: string; last_connection: string | null }>>(
          `COALESCE(
          JSON_AGG(
            json_build_object(
              'id', u.id,
              'email', u.email,
              'last_connection', u.last_connection
            )
          ) FILTER (WHERE u.email IS NOT NULL AND u.active IS TRUE),
          '[]'::json
        )`
        )
        .as('users'),
    ])
    .groupBy(['t.id', 't.name', 't.type'])
    .orderBy('t.name')
    .execute();

  // Récupère tous les réseaux avec leurs tags
  const reseaux = await kdb.selectFrom('reseaux_de_chaleur').select(['id_fcu', 'Identifiant reseau', 'nom_reseau', 'tags']).execute();

  // Récupère toutes les demandes
  const allDemands = (await kdb.selectFrom('demands').selectAll().execute()).map(({ id, legacy_values }) => ({
    ...legacy_values,
    id,
  }));

  // Crée un index des réseaux par tag en utilisant reduce (approche fonctionnelle)
  const reseauxByTag = reseaux.reduce((acc, reseau) => {
    const reseauTags = reseau.tags || [];
    const reseauInfo = {
      'Identifiant reseau': reseau['Identifiant reseau'],
      id_fcu: reseau.id_fcu,
      nom_reseau: reseau.nom_reseau,
    };

    return reseauTags.reduce((tagAcc, tag) => {
      if (!tagAcc.has(tag)) {
        tagAcc.set(tag, []);
      }
      tagAcc.get(tag)!.push(reseauInfo);
      return tagAcc;
    }, acc);
  }, new Map<string, Array<{ id_fcu: number; 'Identifiant reseau': string | null; nom_reseau: string | null }>>());

  // Définit les périodes avec dayjs
  const oneMonthAgo = dayjs().subtract(1, 'month');
  const threeMonthsAgo = dayjs().subtract(3, 'months');
  const sixMonthsAgo = dayjs().subtract(6, 'months');

  // Calcule les stats par tag
  const tagsStats = tagsWithUsers.map((tag) => {
    const tagName = tag.name;
    const reseauxForTag = reseauxByTag.get(tagName) || [];

    // Filtre les demandes qui ont ce tag dans leurs gestionnaires
    const demandsForTag = allDemands.filter((demand) => {
      const demandGestionnaires = demand.Gestionnaires || [];
      return demandGestionnaires.includes(tagName);
    });

    // Calcule les stats par période
    const lastOneMonth = calculatePeriodStats(demandsForTag, oneMonthAgo);
    const lastThreeMonths = calculatePeriodStats(demandsForTag, threeMonthsAgo);
    const lastSixMonths = calculatePeriodStats(demandsForTag, sixMonthsAgo);

    return {
      ...tag,
      lastOneMonth,
      lastSixMonths,
      lastThreeMonths,
      reseaux: reseauxForTag,
    };
  });

  return tagsStats;
};

export type TagsStats = Awaited<ReturnType<typeof getTagsStats>>[number];
