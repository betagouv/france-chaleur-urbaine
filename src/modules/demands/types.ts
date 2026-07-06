import type { NetworkType } from '@/modules/reseaux/constants';
import type { Demand as LegacyDemand } from '@/types/Summary/Demand';

import type { DemandStatus } from './constants';

/**
 * Snapshot d'une demande de réaffectation en attente de traitement admin.
 * Stockée dans la colonne `demands.pending_assignment_change` (JSONB nullable).
 * `network_type`/`network_id` à `null` = demande de désaffectation.
 */
export type PendingAssignmentChange = {
  network_type: NetworkType | null;
  network_id: number | null;
  comment: string | null;
  author_id: string;
  requested_at: string;
  distance: number | null;
};
// Ce type permet de corriger le type Legacy existant avec ce que nous récupérons véritablement de Airtable
export type AirtableLegacyRecord = Partial<Omit<LegacyDemand, 'id' | 'Status'>> & {
  'Campagne keywords'?: string;
  'Campagne matomo'?: string;
  'Campagne source'?: string;
  'ID réseau le plus proche'?: string | null;
  'ID BNB'?: string;
  'Notification envoyé'?: string;
  'Recontacté par le gestionnaire'?: string;
  'Relance ID'?: string;
  'Relance envoyée'?: string;
  'Seconde relance envoyée'?: string;
  Sondage?: string[] | null;
  'Commentaire relance'?: string | null;
  'Distance au réseau'?: number | null;
  'Identifiant réseau'?: string | null;
  'Nom réseau'?: string | null;
  'Code Postal'?: string;
  'Date de la demande': string;
  'ID Conso'?: number;
  Region?: string;
  Status?: DemandStatus | '';
  Mail: string;
  Adresse: string;
  'Relance à activer'?: boolean;
  'Gestionnaire Distance au réseau'?: number | null;
  'Gestionnaire Conso'?: number | null;
  'Gestionnaire Logement'?: number | null;
  'Surface en m2'?: number | null;
  Logement: number;
};

export type Demand = AirtableLegacyRecord & {
  id: string;
  user_id: string | null;
  comment_gestionnaire?: string | null;
  comment_fcu?: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Compteurs d'utilisateurs (hors admin) ayant accès à une demande, groupés par rôle.
 * Toujours fournis par `buildDemandQuery` (compteurs SQL — chaque champ est `0` si vide, jamais absent).
 */
export type AccessCounts = {
  gestionnaire: number;
  collectivite: number;
  alec: number;
  ccrt: number;
};

export type { ReseauxStats } from './server/stats';
