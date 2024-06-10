// departements : par département DJU moyenne + zone climatique
// communes : par commune altitude moyenne + delta température
// Tableau NF P 52-612 CN : à supprimer il me semble
// ratios techniques

export const ratiosTechniques = {
  // Ratios techniques - Généraux
  SurfaceDeRéférence: 70,
  Hauteur: 2.2,
  DJU_REF: 2500,
  NombreHabitantParLogement: 2.17,
  ZoneClimatiqueDeRéférence: 'H1',
  ProductionECS: false,
  TypeDeRésidentiel: 'individuel',
  AppartementOuMaison: 'appartement',
  NombreDeLogement: 1,

  // Ratios techniques - Besoins et choix du bâtiment
  // Chauffage
  Chauffage: [
    {
      nom: 'A',
      value: 45,
      unit: 'kWh/m2/an',
    },
    {
      nom: 'B',
      value: 70,
      unit: 'kWh/m2/an',
    },
    {
      nom: 'C',
      value: 115,
      unit: 'kWh/m2/an',
    },
    {
      nom: 'D',
      value: 165,
      unit: 'kWh/m2/an',
    },
    {
      nom: 'E',
      value: 215,
      unit: 'kWh/m2/an',
    },
    {
      nom: 'F',
      value: 275,
      unit: 'kWh/m2/an',
    },
    {
      nom: 'G',
      value: 300,
      unit: 'kWh/m2/an',
    },
    {
      nom: 'RE2020 - Après 2020',
      value: 0.18,
      unit: 'W/m3.°C',
    },
    {
      nom: 'RT2012 - Entre 2012 et 2020',
      value: 0.22,
      unit: 'W/m3.°C',
    },
    {
      nom: 'RT2005 - Entre 2005 et 2012',
      value: 0.65,
      unit: 'W/m3.°C',
    },
    {
      nom: 'RT2000 - Entre 2000 et 2005',
      value: 0.75,
      unit: 'W/m3.°C',
    },
    {
      nom: 'de 1990 à 2000',
      value: 1,
      unit: 'W/m3.°C',
    },
    {
      nom: 'de 1974 à 1990',
      value: 1.4,
      unit: 'W/m3.°C',
    },
    {
      nom: 'avant 1974',
      value: 2,
      unit: 'W/m3.°C',
    },
    {
      nom: 'Bureaux RE2020',
      value: 50,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Bureaux RT2012',
      value: 65,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Bureaux Moyenne française 2021',
      value: 95,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Enseignement secondaire RE2020',
      value: 40,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Enseignement secondaire RT2012',
      value: 55,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Enseignement secondaire Moyenne française 2021',
      value: 81,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Commerces RE2020',
      value: 40,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Commerces RT2012',
      value: 55,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Commerces Moyenne française 2021',
      value: 74,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Café, restaurant RE2020',
      value: 100,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Café, restaurant RT2012',
      value: 100,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Café, restaurant Moyenne française 2021',
      value: 106,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Hôtel RE2020',
      value: 45,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Hôtel RT2012',
      value: 55,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Hôtel Moyenne française 2021',
      value: 83,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Enseignement primaire RE2020',
      value: 50,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Enseignement primaire RT2012',
      value: 65,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Enseignement primaire Moyenne française 2021',
      value: 81,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Sport RE2020',
      value: 30,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Sport RT2012',
      value: 45,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Sport Moyenne française 2021',
      value: 97,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Santé RE2020',
      value: 35,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Santé RT2012',
      value: 55,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'Santé Moyenne française 2021',
      value: 100,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'EHPAD RE2020',
      value: 55,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'EHPAD RT2012',
      value: 75,
      unit: 'kWhef/m2.an',
    },
    {
      nom: 'EHPAD Moyenne française 2021',
      value: 110,
      unit: 'kWhef/m2.an',
    },
  ],

  // FIXME mettre tout le tableau
  ECS_Résidentiel: 35,
  RAF_Résidentiel: 8,
} as const;
