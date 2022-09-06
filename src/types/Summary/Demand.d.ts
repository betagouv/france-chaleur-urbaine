export type DemandSummary = {
  id: string;
  Nom: string;
  Prénom?: string;
  Adresse: string;
  'Mode de chauffage': string;
  'Type de chauffage': string;
};

export type EditableDemandSummary = {
  'Prise de contact': boolean;
  Commentaire: string;
  Status: string;
};

export type Demand = DemandSummary &
  EditableDemandSummary & {
    Mail: string;
    'Distance au réseau': string;
    'N° de dossier': string;
    'en ZDP': string;
    'Date de la demande': string;
    Structure: string;
    Ville: string;
  };
