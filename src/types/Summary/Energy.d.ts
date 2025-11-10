export enum ENERGY_USED {
  Fioul = 'fioul',
  FioulDomestique = 'fioul_domestique',
  Gaz = 'gaz',
  GazNaturel = 'gaz_naturel',
  GazCollectif = 'gaz_collectif',
  GazPropaneButane = 'gaz_propane_butane',
  Charbon = 'charbon',
  BoisDeChauffage = 'bois_de_chauffage',
  Electricite = 'electricite',
  EnergieAutre = 'energie_autre',
  SansObjet = 'sans objet',
  Default = 'default',
}

export interface EnergySummary {
  id: number;
  addr_label: string;
  energie_utilisee: ENERGY_USED;
  dpe_energie: string;
  dpe_ges: string;
  nb_logements: number;
  annee_construction?: number;
  is_close: boolean;
  type_usage: string;
  type_chauffage: string;
}
