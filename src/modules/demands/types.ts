import type { Demand } from '@/types/Summary/Demand';

export const demandStatuses = [
  { label: 'En attente de prise en charge', value: 'EMPTY' },
  { label: 'Non réalisable', value: 'UNREALISABLE' },
  { label: 'En attente d’éléments du prospect', value: 'WAITING' },
  { label: 'Étude en cours', value: 'IN_PROGRESS' },
  { label: 'Voté en AG', value: 'VOTED' },
  { label: 'Travaux en cours', value: 'WORK_IN_PROGRESS' },
  { label: 'Réalisé', value: 'DONE' },
  { label: 'Projet abandonné par le prospect', value: 'ABANDONNED' },
];

export type AirtableLegacyRecord = Partial<Omit<Demand, 'id' | 'Status'>> & {
  'ID BNB'?: string;
  'Notification envoyé'?: string;
  'Recontacté par le gestionnaire'?: string;
  'Relance ID'?: string;
  Sondage?: string | string[];
  'Commentaire relance'?: string;
  'Distance au réseau'?: number | null;
  'Code Postal'?: string;
  'Date de la demande'?: string;
  'ID Conso'?: number;
  Region?: string;
  Status?: (typeof demandStatuses)[number]['label'] | '';
};
