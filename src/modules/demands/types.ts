import type { Demand as LegacyDemand } from '@/types/Summary/Demand';

import type { DemandStatus } from './constants';
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
  comment_gestionnaire?: string;
  comment_fcu: string;
  created_at: string;
  updated_at: string;
};
