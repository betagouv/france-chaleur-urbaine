export type DemandSummary = {
  id: string;
  Nom: string;
  Prénom?: string;
  Adresse: string;
  'Mode de chauffage': string;
  'Type de chauffage': string;
  Structure: string;
  Gestionnaires: string[];
};

export type EditableDemandSummary = {
  'Prise de contact': boolean;
  Commentaire: string;
  Status: string;
};

export type Demand = DemandSummary &
  EditableDemandSummary & {
    Mail: string;
    Téléphone: string;
    Éligibilité: boolean;
    'Distance au réseau': number;
    'Gestionnaire Distance au réseau': number;
    'N° de dossier': string;
    'en ZDP': string;
    'Date demandes': string;
    Établissement: string;
    Ville: string;
    Conso: number;
    'Gestionnaire Conso': number;
    Logement: number;
    'Gestionnaire Logement': number;
    'Relance envoyée': string;
  };
