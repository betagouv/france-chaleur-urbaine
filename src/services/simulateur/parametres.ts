import { communes } from './communes';
import { departements } from './departements';
import { createParametresObject, typeBool, typeString } from './helper';
import { ratiosTechniques } from './ratios';

export const parametres = createParametresObject({
  // Généraux
  // pas besoin du mode d'affichage ici
  Departement: {
    defaultValue: '73', // Savoie
    type: typeString,
  },
  Commune: {
    defaultValue: '57629', // Abainville
    type: typeString,
  },
  DegréJoursUnifiéSpécifique: {
    // default: (s) => departements.find((d) => d.codeDepartement === s.Departement)?.djuMoyenne ?? ratiosTechniques.DJU_REF,
    defaultFormula: (state) => departements.find((d) => d.codeDepartement === state['Departement'])?.djuMoyenne ?? ratiosTechniques.DJU_REF,
    predecessors: ['Departement'],
  },
  TempératureRéférence: {
    defaultFormula: (state) => communes.find((c) => c.codeInsee === state['Commune'])?.altitudeMoyenne ?? 0,
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
    defaultFormula: (state) => (state['MethodeCalculBesoins'] === 'dpe' ? ratiosTechniques.Chauffage.find((i) => i.nom === state['DPE'])?.value : ratiosTechniques.Chauffage.find((i) => i.nom === state['NormeThermique'])?.value),
    unit: 'W/m3.°C',
    predecessors: ['MethodeCalculBesoins', 'DPE', 'NormeThermique'],
    // predecessors: 'AppartementOuMaison'
  },
  BesoinsChauffage: {
    // =IFERROR(IF(Choix_methode<>"Normes thermiques et âge du bâtiment";Conso_spé*Surface*_DJU_spe/DJU_ref;Conso_spé*24*_DJU_spe*Surface*Hauteur/1000);"Veuillez choisir le/la "&$A$26)
    defaultFormula: (state) =>
      state['MethodeCalculBesoins'] === 'dpe'
        ? (state['ConsommationSpecifiqueChauffage'] * state['Surface'] * state['DegréJoursUnifiéSpécifique']) / ratiosTechniques.DJU_REF
        : (state['ConsommationSpecifiqueChauffage'] * 24 * state['DegréJoursUnifiéSpécifique'] * state['Surface'] * ratiosTechniques.Hauteur) / 1000,
    unit: 'kWh',
    predecessors: ['MethodeCalculBesoins', 'ConsommationSpecifiqueChauffage', 'Surface', 'DegréJoursUnifiéSpécifique'],
  },
  ConsommationSpecifiqueECS: {
    // =IF(Type_bat="Tertiaire";XLOOKUP(1;('Ratios techniques'!A:A="ECS")*('Ratios techniques'!B:B=$C$26);'Ratios techniques'!C:C;"Non trouvé");XLOOKUP(1;('Ratios techniques'!A:A="ECS")*('Ratios techniques'!B:B=Type_bat);'Ratios techniques'!C:C;"Non trouvé"))
    defaultFormula: (state) => (state['TypeBatiment'] === 'tertiaire' ? /*state['NormeThermique']*/ 0 : ratiosTechniques.ECS_Résidentiel),
    unit: '???',
    predecessors: ['TypeBatiment', 'Surface'],
  },
  BesoinsEauChaudeSanitaire: {
    defaultFormula: (state) => (state['ProductionECS'] ? state['ConsommationSpecifiqueChauffage'] * state['Surface'] : 0), // =IF(Prod_ECS?="Oui";Conso_ECS_spé*Surface;0)
    unit: 'kWh',
    predecessors: ['ProductionECS', 'ConsommationSpecifiqueChauffage', 'Surface'],
  },
  ConsommationSpecifiqueRafraichissement: {
    // =IF(Type_bat="Tertiaire";XLOOKUP(1;('Ratios techniques'!A:A="RAF")*('Ratios techniques'!B:B=$C$26);'Ratios techniques'!C:C;"Non trouvé");XLOOKUP(1;('Ratios techniques'!A:A="RAF")*('Ratios techniques'!B:B=Type_bat);'Ratios techniques'!C:C;"Non trouvé"))
    defaultFormula: (state) => (state['TypeBatiment'] === 'tertiaire' ? /*state['NormeThermique']*/ 0 : ratiosTechniques.RAF_Résidentiel),
    unit: '???',
    predecessors: ['ConsommationSpecifiqueChauffage', 'Surface'],
  },
  BesoinsEnClimatisation: {
    defaultFormula: (state) => state['ConsommationSpecifiqueChauffage'] * state['Surface'], // =Conso_spé_raf*Surface
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
  RCU_DuréeAvantRenouvellement: {
    defaultValue: 30,
    unit: 'Années',
  },
});

export type KeyParametre = keyof typeof parametres; // FIXME fonctionnait à un moment donné...

// compute the successors using the predecessors
const successorsByParametre = Object.entries(parametres).reduce(
  (acc, [parametreKey, parametre]) => {
    parametre.predecessors?.forEach((predecessor: KeyParametre) => {
      let predecessorSuccessors = acc[predecessor];
      if (!predecessorSuccessors) {
        acc[predecessor] = predecessorSuccessors = [] as KeyParametre[];
      }
      predecessorSuccessors.push(parametreKey as KeyParametre);
    });
    return acc;
  },
  {} as Record<KeyParametre, KeyParametre[]>
);
Object.entries(successorsByParametre).forEach(([parametre, successors]) => {
  parametres[parametre as KeyParametre].successors = successors as any; // FIXME fonctionnait à un moment donné...
});

// console.log('parameters', parametres);
