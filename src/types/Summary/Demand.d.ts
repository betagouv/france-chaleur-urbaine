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
    'Distance au réseau': number;
    'N° de dossier': string;
    'en ZDP': string;
    'Date demandes': string;
    Établissement: string;
    Structure: string;
    Ville: string;
    Conso: number;
    Logement: number;
  };
