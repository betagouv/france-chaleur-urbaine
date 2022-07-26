export enum EnergyType {
  Fuel = 'fuelOil',
  Gas = 'gas',
  Wood = 'wood',
  Electric = 'electric',
  Unknown = 'unknow',
}

export enum EnergyUsed {
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
  EnergyUsed.Fioul,
  EnergyUsed.FioulDomestique,
  EnergyUsed.Gaz,
  EnergyUsed.GazNaturel,
  EnergyUsed.GazCollectif,
  EnergyUsed.GazPropaneButane,
];
