export type DemandSummary = {
  id: string;
  Nom: string;
  Prénom?: string;
  Adresse: string;
  'Mode de chauffage': string;
  'Type de chauffage': string;
};

export type EditableDemandSummary = {
  'Date de mise à jour': string;
  Raccordable: boolean;
  'Prise de contact avec le demandeur réalisée par l’exploitant': boolean;
  'En attente d’éléments complémentaires de la part du demandeur': boolean;
  'Etude en cours': boolean;
  'Raccordement abandonné par la copropriété ou l’établissement tertiaire': boolean;
  'Raccordement voté en AG de copropriété': boolean;
  'Travaux en cours': boolean;
  'Raccordement effectué': boolean;
  Commentaire: string;
};

export type Demand = DemandSummary &
  EditableDemandSummary & {
    Mail: string;
    'Distance au réseau': string;
    'N° de dossier': string;
  };
