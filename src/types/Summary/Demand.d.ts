export type DemandSummary = {
  Nom: string;
  Prénom?: string;
  Adresse: string;
  'Mode de chauffage': string;
  'Type de chauffage': string;
};

export type Demand = DemandSummary & {
  Mail: string;
  'Distance au réseau': string;
  'N° de dossier': string;
};
