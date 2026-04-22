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
  'ID BNB'?: string;
  'Notification envoyé'?: string;
  'Recontacté par le gestionnaire'?: string;
  'Relance ID'?: string;
  Sondage?: string[];
  'Commentaire relance'?: string;
  'Distance au réseau'?: number | null;
  'Code Postal'?: string;
  'Date de la demande': string;
  'ID Conso'?: number;
  Region?: string;
  Status?: DemandStatus | '';
  Mail: string;
  Adresse: string;
  'Relance à activer'?: boolean;
  Gestionnaires: string[] | null;
  'Gestionnaire Distance au réseau'?: number | null;
  'Affecté à': string | string[] | null;
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

export type { ReseauxStats, TagsStats } from './server/stats';
