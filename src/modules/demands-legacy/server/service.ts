import { kdb } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import type { ReseauWithStats, ReseauxDemandesStatsResponse } from '../types';
import { getAllDemands } from './get-all-demands';

/**
 * Calcule les statistiques des demandes par réseau.
 * Les stats sont calculées côté serveur pour optimiser les performances.
 */
export const getReseauxDemandesStats = async (): Promise<ReseauxDemandesStatsResponse> => {
  // Récupère tous les réseaux avec leurs tags
  const reseaux = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select(['id_fcu', 'Identifiant reseau', 'nom_reseau', 'Gestionnaire', 'tags'])
    .orderBy('id_fcu')
    .execute();

  // Récupère toutes les demandes
  const allDemands = await getAllDemands();

  // Calcule les statistiques par réseau
  const reseauxWithStats: ReseauWithStats[] = reseaux.map((reseau) => {
    // Filtre les demandes qui correspondent à ce réseau via les tags
    const reseauTags = reseau.tags || [];
    const demandsForReseau = allDemands.filter((demand) => {
      const demandGestionnaires = demand.Gestionnaires || [];
      // Une demande correspond au réseau si au moins un tag du réseau est dans les gestionnaires de la demande
      return reseauTags.some((tag) => demandGestionnaires.includes(tag));
    });

    // Calcule les statistiques par statut
    const statsByStatus: Record<string, number> = {};
    demandsForReseau.forEach((demand) => {
      const status = demand.Status || DEMANDE_STATUS.EMPTY;
      statsByStatus[status] = (statsByStatus[status] || 0) + 1;
    });

    // Pour chaque tag du réseau, trouve les demandes éligibles en attente depuis plus de 6 mois
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const tagsWithOldPendingDemands = reseauTags.map((tag) => {
      // Filtre les demandes éligibles avec ce tag, status "En attente de prise en charge" et date > 6 mois
      const oldPendingDemands = demandsForReseau.filter((demand) => {
        const hasTag = (demand.Gestionnaires || []).includes(tag);
        const isEligible = demand.Éligibilité === true;
        const isPending = (demand.Status || DEMANDE_STATUS.EMPTY) === DEMANDE_STATUS.EMPTY;
        const dateDemande = demand['Date demandes'];

        if (!hasTag || !isEligible || !isPending || !dateDemande) {
          return false;
        }

        // Parse la date (format Airtable peut être une string ISO)
        let demandDate: Date;
        try {
          if (typeof dateDemande === 'string') {
            demandDate = new Date(dateDemande);
          } else {
            demandDate = new Date(dateDemande);
          }
        } catch {
          return false;
        }

        // Vérifie si la date est valide et si elle est antérieure à 6 mois
        return !Number.isNaN(demandDate.getTime()) && demandDate < sixMonthsAgo;
      });

      return {
        oldPendingDemands: oldPendingDemands.map((demand) => ({
          Adresse: demand.Adresse,
          'Date demandes': demand['Date demandes'],
          id: demand.id,
          Mail: demand.Mail,
          Nom: demand.Nom,
          Prénom: demand.Prénom,
        })),
        oldPendingDemandsCount: oldPendingDemands.length,
        tag,
      };
    });

    return {
      Gestionnaire: reseau.Gestionnaire,
      'Identifiant reseau': reseau['Identifiant reseau'],
      id_fcu: reseau.id_fcu,
      nom_reseau: reseau.nom_reseau,
      statsByStatus,
      tags: reseauTags,
      tagsWithOldPendingDemands,
    };
  });

  // Calcule les statistiques globales
  // IMPORTANT: Ne pas additionner les stats par réseau car une demande peut être liée à plusieurs réseaux
  // Il faut compter les demandes uniques globalement
  const totalReseaux = reseauxWithStats.length;

  // Compte les demandes uniques (une demande peut être liée à plusieurs réseaux)
  const uniqueDemandIds = new Set<string>();
  const uniquePendingDemandIds = new Set<string>();
  const uniqueOldPendingDemandIds = new Set<string>();

  allDemands.forEach((demand) => {
    uniqueDemandIds.add(demand.id);

    const isPending = (demand.Status || DEMANDE_STATUS.EMPTY) === DEMANDE_STATUS.EMPTY;
    if (isPending) {
      uniquePendingDemandIds.add(demand.id);
    }
  });

  // Pour les demandes en attente > 6 mois, vérifie chaque demande unique
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  allDemands.forEach((demand) => {
    const isEligible = demand.Éligibilité === true;
    const isPending = (demand.Status || DEMANDE_STATUS.EMPTY) === DEMANDE_STATUS.EMPTY;
    const dateDemande = demand['Date demandes'];

    if (isEligible && isPending && dateDemande) {
      try {
        const demandDate = typeof dateDemande === 'string' ? new Date(dateDemande) : new Date(dateDemande);
        if (!Number.isNaN(demandDate.getTime()) && demandDate < sixMonthsAgo) {
          uniqueOldPendingDemandIds.add(demand.id);
        }
      } catch {
        // Ignore les dates invalides
      }
    }
  });

  const totalDemandes = uniqueDemandIds.size;
  const totalEnAttente = uniquePendingDemandIds.size;
  const totalEnAttente6Mois = uniqueOldPendingDemandIds.size;

  const reseauxAvecProblemes = reseauxWithStats.filter((reseau) =>
    reseau.tagsWithOldPendingDemands.some((tagData) => tagData.oldPendingDemandsCount > 0)
  ).length;

  return {
    globalStats: {
      reseauxAvecProblemes,
      totalDemandes,
      totalEnAttente,
      totalEnAttente6Mois,
      totalReseaux,
    },
    reseaux: reseauxWithStats,
  };
};
