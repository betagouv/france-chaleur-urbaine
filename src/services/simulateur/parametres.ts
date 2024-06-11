import { communes } from './communes';
import { departements } from './departements';
import { completeSuccessors, createParametresObject, typeBool, typeString } from './helper';
import { ratiosTechniques } from './ratios';

export const parametres = createParametresObject({
  // Généraux
  // pas besoin du mode d'affichage ici
  Departement: {
    defaultValue: '59', // Nord
    type: typeString,
    options: departements.map((c) => ({ label: c.nom, value: c.codeDepartement })),
  },
  Commune: {
    defaultValue: '22163', // Lille
    type: typeString,
    options: communes.map((c) => ({ label: c.nom, value: c.codeInsee })),
  },
  DegréJoursUnifiéSpécifique: {
    defaultFormula: (getValue) => departements.find((d) => d.codeDepartement === getValue('Departement'))?.djuMoyenne ?? ratiosTechniques.DJU_REF,
    predecessors: ['Departement'],
  },
  TempératureRéférence: {
    defaultFormula: (getValue) => communes.find((c) => c.codeInsee === getValue('Commune'))?.temperatureRefAltitudeMoyenne ?? 0,
    predecessors: ['Commune'],
  },

  // Choix du bâtiment
  TypeBatiment: {
    defaultValue: 'residentiel', // ou tertiaire
    unit: 'm²',
    type: typeString,
  },
  TypeDeRésidentiel: {
    defaultValue: ratiosTechniques.TypeDeRésidentiel,
    unit: 'm²',
    type: typeString,
  },
  AppartementOuMaison: {
    defaultValue: ratiosTechniques.AppartementOuMaison,
    type: typeString,
  },
  Surface: {
    defaultValue: ratiosTechniques.SurfaceDeRéférence,
    unit: 'm²',
  },
  NombreHabitantParLogement: {
    defaultValue: ratiosTechniques.NombreHabitantParLogement,
    unit: 'personnes',
  },
  ProductionECS: {
    defaultValue: ratiosTechniques.ProductionECS,
    type: typeBool,
  },

  // Besoins calculés
  MethodeCalculBesoins: {
    defaultValue: 'normes_thermiques', // ou dpe
    type: typeString,
  },
  DPE: {
    defaultValue: 'D',
    type: typeString,
  },
  NormeThermique: {
    defaultValue: 'de 1974 à 1990',
    type: typeString,
  },
  ConsommationSpecifiqueChauffage: {
    // =XLOOKUP(1;('Ratios techniques'!A:A="CHAF")*('Ratios techniques'!B:B=$C$26);'Ratios techniques'!C:C;"Non trouvé")
    defaultFormula: (getValue) => (getValue('MethodeCalculBesoins') === 'dpe' ? ratiosTechniques.Chauffage.find((i) => i.nom === getValue('DPE'))?.value : ratiosTechniques.Chauffage.find((i) => i.nom === getValue('NormeThermique'))?.value),
    unit: 'W/m3.°C',
    predecessors: ['MethodeCalculBesoins', 'DPE', 'NormeThermique'],
  },
  BesoinsChauffage: {
    // =IFERROR(IF(Choix_methode<>"Normes thermiques et âge du bâtiment";Conso_spé*Surface*_DJU_spe/DJU_ref;Conso_spé*24*_DJU_spe*Surface*Hauteur/1000);"Veuillez choisir le/la "&$A$26)
    defaultFormula: (getValue) =>
      getValue('MethodeCalculBesoins') === 'dpe'
        ? (getValue('ConsommationSpecifiqueChauffage') * getValue('Surface') * getValue('DegréJoursUnifiéSpécifique')) / ratiosTechniques.DJU_REF
        : (getValue('ConsommationSpecifiqueChauffage') * 24 * getValue('DegréJoursUnifiéSpécifique') * getValue('Surface') * ratiosTechniques.Hauteur) / 1000,
    unit: 'kWh',
    predecessors: ['MethodeCalculBesoins', 'ConsommationSpecifiqueChauffage', 'Surface', 'DegréJoursUnifiéSpécifique'],
  },
  ConsommationSpecifiqueECS: {
    // =IF(Type_bat="Tertiaire";XLOOKUP(1;('Ratios techniques'!A:A="ECS")*('Ratios techniques'!B:B=$C$26);'Ratios techniques'!C:C;"Non trouvé");XLOOKUP(1;('Ratios techniques'!A:A="ECS")*('Ratios techniques'!B:B=Type_bat);'Ratios techniques'!C:C;"Non trouvé"))
    defaultFormula: (getValue) => (getValue('TypeBatiment') === 'tertiaire' ? /*getValue('NormeThermique')*/ 0 : ratiosTechniques.ECS_Résidentiel),
    unit: '???',
    predecessors: ['TypeBatiment', 'Surface'],
  },
  BesoinsEauChaudeSanitaire: {
    // =IF(Prod_ECS?="Oui";Conso_ECS_spé*Surface;0)
    defaultFormula: (getValue) => (getValue('ProductionECS') ? getValue('ConsommationSpecifiqueChauffage') * getValue('Surface') : 0),
    unit: 'kWh',
    predecessors: ['ProductionECS', 'ConsommationSpecifiqueChauffage', 'Surface'],
  },
  ConsommationSpecifiqueRafraichissement: {
    // =IF(Type_bat="Tertiaire";XLOOKUP(1;('Ratios techniques'!A:A="RAF")*('Ratios techniques'!B:B=$C$26);'Ratios techniques'!C:C;"Non trouvé");XLOOKUP(1;('Ratios techniques'!A:A="RAF")*('Ratios techniques'!B:B=Type_bat);'Ratios techniques'!C:C;"Non trouvé"))
    defaultFormula: (getValue) => (getValue('TypeBatiment') === 'tertiaire' ? /*getValue('NormeThermique')*/ 0 : ratiosTechniques.RAF_Résidentiel),
    unit: '???',
    predecessors: ['ConsommationSpecifiqueChauffage', 'Surface'],
  },
  BesoinsEnClimatisation: {
    // =Conso_spé_raf*Surface
    defaultFormula: (getValue) => getValue('ConsommationSpecifiqueChauffage') * getValue('Surface'),
    unit: 'kWh',
    predecessors: ['ConsommationSpecifiqueChauffage', 'Surface'],
  },

  // Calcul puissance
  Puissance_TemperatureDeNonChauffage: {
    defaultValue: 18,
    unit: '°C',
  },
  Puissance_FacteurDeSurpuissance: {
    defaultValue: 20,
    unit: '%',
  },
  Puissance_NombreHeureFonctionnementNonClimatiqueECS: {
    defaultValue: 3000,
    unit: 'h',
  },
  Puissance_CoefficientDeFoisonnementECS: {
    defaultValue: 50,
    unit: '%',
  },

  // RCU
  RCU_RendementSousStationChauffage: {
    defaultValue: 98,
    unit: '%',
  },
  RCU_RendementSousStationECS: {
    defaultValue: 98,
    unit: '%',
  },
  RCU_ConsoAuxilliaireChauffage: {
    defaultValue: 91,
    unit: '%',
  },
  RCU_ConsoAuxilliaireECS: {
    defaultValue: 96,
    unit: '%',
  },
  RCU_DuréeDeVie: {
    defaultValue: 30,
    unit: 'Années',
  },

  // RFU
  RFU_RendementSousStation: {
    defaultValue: 98,
    unit: '%',
  },
  RFU_ConsoAuxilliaire: {
    defaultValue: 95,
    unit: '%',
  },
  RFU_DuréeDeVie: {
    defaultValue: 30,
    unit: 'Années',
  },

  // Poêle à granulés indiv
  PoêleGranulésIndividuel_RendementChauffage: {
    defaultValue: 80,
    unit: '%',
  },
  PoêleGranulésIndividuel_ConsoCombustible: {
    defaultValue: 0.217391304,
    unit: 'kg/kWh',
  },
  PoêleGranulésIndividuel_DuréeDeVie: {
    defaultValue: 16,
    unit: 'Années',
  },

  // Chaudière à granulés coll
  ChaudièreGranulésCollectif_RendementChauffage: {
    defaultValue: 80,
    unit: '%',
  },
  ChaudièreGranulésCollectif_ConsoCombustible: {
    defaultValue: 0.217391304,
    unit: 'kg/kWh',
  },
  ChaudièreGranulésCollectif_ConsoAuxilliaire: {
    defaultValue: 98,
    unit: '%',
  },
  ChaudièreGranulésCollectif_DuréeDeVie: {
    defaultValue: 17,
    unit: 'Années',
  },

  // Calculs techniques (pas paramétrables)
  NbHeureFonctionnementPleinePuissanceChauffageContinu: {
    // =(DJU_spe*24)/(TNC-Temp_ref)
    defaultFormula: (getValue) => (getValue('DegréJoursUnifiéSpécifique') * 24) / (getValue('Puissance_TemperatureDeNonChauffage') - getValue('TempératureRéférence')),
    unit: 'kWh',
    predecessors: ['DegréJoursUnifiéSpécifique', 'Puissance_TemperatureDeNonChauffage', 'TempératureRéférence'],
  },
  // =IF(Type_bat="Tertiaire";XLOOKUP(1;('Ratios techniques'!A:A="RAF")*('Ratios techniques'!B:B=$C$26);'Ratios techniques'!C:C;"Non trouvé");XLOOKUP(1;('Ratios techniques'!A:A="RAF")*('Ratios techniques'!B:B=Type_bat);'Ratios techniques'!C:C;"Non trouvé"))
  NbHeureFonctionnementPleinePuissance: {
    // =NHFPPcc*(IF(Type_bat="Résidentiel";XLOOKUP('Paramètres techniques'!C26;'Ratios techniques'!$B$139:$B$152;'Ratios techniques'!$C$139:$C$152);XLOOKUP(Choix_methode;'Ratios techniques'!$B$139:$B$162;'Ratios techniques'!$C$139:$C$162)))
    defaultFormula: (getValue) => getValue('NbHeureFonctionnementPleinePuissance') * (getValue('TypeBatiment') === 'residentiel' ? ratiosTechniques.Puissance_CoefficientIntermittence.find((e) => e.nom === getValue('DPE'))?.value : getValue('MethodeCalculBesoins')), // FIXME 2e partie formule semble erronée
    unit: 'kWh',
    predecessors: ['NbHeureFonctionnementPleinePuissance', 'TypeBatiment', 'DPE', 'MethodeCalculBesoins'],
  },
});

export type KeyParametre = keyof typeof parametres;

// compute the successors using the predecessors
completeSuccessors(parametres);
