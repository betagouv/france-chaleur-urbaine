import { kdb, sql } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import type { TagStats, TagsStatsResponse } from '../types';
import { getAllDemands } from './get-all-demands';

/**
 * Calcule les statistiques des demandes par tag.
 * Inclut les utilisateurs gestionnaires, les réseaux, et les stats de demandes.
 */
export const getTagsStats = async (): Promise<TagsStatsResponse> => {
  // Récupère tous les tags avec leurs utilisateurs
  const tagsWithUsers = await kdb
    .selectFrom('tags as t')
    .leftJoin('users as u', (join) => join.on(sql.ref('t.name'), '=', sql`ANY(${sql.ref('u.gestionnaires')})`))
    .select([
      't.id',
      't.name',
      't.type',
      sql
        .raw<Array<{ id: number; email: string }>>(
          `COALESCE(
          JSON_AGG(
            json_build_object(
              'id', u.id,
              'email', u.email
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
  const allDemands = await getAllDemands();

  // Crée un index des réseaux par tag pour accès rapide
  const reseauxByTag = new Map<string, Array<{ id_fcu: number; 'Identifiant reseau': string | null; nom_reseau: string | null }>>();
  reseaux.forEach((reseau) => {
    const reseauTags = reseau.tags || [];
    reseauTags.forEach((tag) => {
      if (!reseauxByTag.has(tag)) {
        reseauxByTag.set(tag, []);
      }
      reseauxByTag.get(tag)!.push({
        'Identifiant reseau': reseau['Identifiant reseau'],
        id_fcu: reseau.id_fcu,
        nom_reseau: reseau.nom_reseau,
      });
    });
  });

  // Calcule les stats par tag
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const tagsStats: TagStats[] = tagsWithUsers.map((tag) => {
    const tagName = tag.name;
    const users = (tag.users || []).filter((u) => u.id && u.email);

    // Récupère les réseaux qui ont ce tag
    const reseauxForTag = reseauxByTag.get(tagName) || [];

    // Filtre les demandes qui ont ce tag dans leurs gestionnaires
    const demandsForTag = allDemands.filter((demand) => {
      const demandGestionnaires = demand.Gestionnaires || [];
      return demandGestionnaires.includes(tagName);
    });

    // Calcule les statistiques par statut
    const statsByStatus: Record<string, number> = {};
    demandsForTag.forEach((demand) => {
      const status = demand.Status || DEMANDE_STATUS.EMPTY;
      statsByStatus[status] = (statsByStatus[status] || 0) + 1;
    });

    // Compte les demandes éligibles en attente depuis plus de 6 mois
    const oldPendingDemands = demandsForTag.filter((demand) => {
      const isEligible = demand.Éligibilité === true;
      const isPending = (demand.Status || DEMANDE_STATUS.EMPTY) === DEMANDE_STATUS.EMPTY;
      const dateDemande = demand['Date demandes'];

      if (!isEligible || !isPending || !dateDemande) {
        return false;
      }

      try {
        const demandDate = typeof dateDemande === 'string' ? new Date(dateDemande) : new Date(dateDemande);
        return !Number.isNaN(demandDate.getTime()) && demandDate < sixMonthsAgo;
      } catch {
        return false;
      }
    });

    const oldPendingDemandsCount = oldPendingDemands.length;
    const hasAlert = oldPendingDemandsCount >= 3;

    return {
      hasAlert,
      oldPendingDemandsCount,
      reseaux: reseauxForTag,
      statsByStatus,
      tagId: tag.id,
      tagName,
      tagType: tag.type,
      totalDemandes: demandsForTag.length,
      users,
    };
  });

  return {
    tags: tagsStats,
  };
};
