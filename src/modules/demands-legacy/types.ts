import type { Demand } from '@/types/Summary/Demand';

export type { Demand };

export type ReseauWithStats = {
  id_fcu: number;
  'Identifiant reseau': string | null;
  nom_reseau: string | null;
  Gestionnaire: string | null;
  tags: string[];
  statsByStatus: Record<string, number>;
  tagsWithOldPendingDemands: Array<{
    tag: string;
    oldPendingDemandsCount: number;
    oldPendingDemands: Array<{
      id: string;
      Nom: string;
      Prénom?: string;
      Adresse: string;
      'Date demandes': string;
      Mail: string;
    }>;
  }>;
};

export type ReseauxDemandesStatsResponse = {
  reseaux: ReseauWithStats[];
  globalStats: {
    totalReseaux: number;
    totalDemandes: number;
    totalEnAttente: number;
    totalEnAttente6Mois: number;
    reseauxAvecProblemes: number;
  };
};

export type TagStats = {
  tagId: string;
  tagName: string;
  tagType: string;
  users: Array<{
    id: number;
    email: string;
  }>;
  reseaux: Array<{
    id_fcu: number;
    'Identifiant reseau': string | null;
    nom_reseau: string | null;
  }>;
  statsByStatus: Record<string, number>;
  totalDemandes: number;
  oldPendingDemandsCount: number; // Demandes éligibles en attente depuis plus de 6 mois
  hasAlert: boolean; // true si >= 3 demandes éligibles en attente depuis plus de 6 mois
};

export type TagsStatsResponse = {
  tags: TagStats[];
};
