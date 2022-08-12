export enum ENERGY_TYPE {
  Fuel = 'fuelOil',
  Gas = 'gas',
  Wood = 'wood',
  Electric = 'electric',
  Unknown = 'unknow',
}

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

export const meaningFullEnergies = [
  ENERGY_USED.Fioul,
  ENERGY_USED.FioulDomestique,
  ENERGY_USED.Gaz,
  ENERGY_USED.GazNaturel,
  ENERGY_USED.GazCollectif,
  ENERGY_USED.GazPropaneButane,
];
