import type { Demand } from '@/types/Summary/Demand';

export type AirtableLegacyRecord = Omit<Demand, 'id'> & {
  'ID BNB'?: string;
  'Notification envoyé'?: string;
  'Recontacté par le gestionnaire'?: string;
  'Relance ID'?: string;
  Sondage?: string | string[];
  'Commentaire relance'?: string;
  'Distance au réseau'?: number | null;
};
