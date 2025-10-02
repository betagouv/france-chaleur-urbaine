import { describe, expect, it } from 'vitest';

import { evaluateAST, parseExpressionToAST, parseResultActions, testExpression } from './expression-parser';

describe('expression-parser', () => {
  // Données d'éligibilité de test
  const sampleEligibilityData = {
    commune: {
      insee_com: '94028',
      insee_dep: '94',
      insee_reg: '11',
      nom: 'Créteil',
    },
    communes: ['Créteil'],
    departement: {
      insee_dep: '94',
      nom: 'Val-de-Marne',
    },
    distance: 0,
    epci: {
      code: '200054781',
      nom: 'Métropole du Grand Paris',
      type: 'METRO',
    },
    ept: {
      code: '200057958',
      nom: 'Établissement public territorial Grand-Orly Seine Bièvre',
    },
    id_sncu: '9402C',
    nom: 'Réseaux de Créteil - Scuc',
    pdp: {
      communes: ['Créteil'],
      'Identifiant reseau': '9402C',
      id_fcu: 162,
      reseau_de_chaleur_ids: [],
      reseau_en_construction_ids: [9, 71, 72],
    },
    region: {
      insee_reg: '11',
      nom: 'Île-de-France',
    },
    reseauDeChaleur: {
      communes: ['Créteil'],
      distance: 29,
      'Identifiant reseau': '9402C',
      id_fcu: 296,
      nom_reseau: 'Réseaux de Créteil - Scuc',
      tags: ['Dalkia', 'Dalkia_IDF', 'Dalkia_9402C'],
    },
    reseauDeChaleurSansTrace: {
      communes: ['Créteil'],
      'Identifiant reseau': '9403C',
      id_fcu: 1076,
      nom: 'Créteil',
      nom_reseau: 'Réseau Créteil Village',
      tags: ['Dalkia', 'Dalkia_IDF'],
    },
    reseauEnConstruction: {
      communes: ['Bourg-la-Reine'],
      distance: 8752,
      id_fcu: 158,
      nom_reseau: null,
      tags: ['SIPPEREC', 'SIPPEREC_BLR'],
    },
    tags: ['ENGIE', 'ENGIE_IDF', 'DALKIA', 'Dalkia', 'Dalkia_IDF', 'Dalkia_9402C'],
    type: 'dans_pdp',
    zoneEnConstruction: {
      communes: ['Créteil'],
      distance: 0,
      id_fcu: 71,
      nom_reseau: 'Réseaux de Créteil - Scuc',
      tags: ['Dalkia', 'Dalkia_IDF', 'Dalkia_9402C'],
    },
  };

  // Tests de parsing et d'évaluation - Nouvelle syntaxe
  const testCases = [
    // Tests tags
    {
      data: sampleEligibilityData,
      desc: 'Tag simple présent',
      expected: true,
      expr: 'tag:"ENGIE"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Tag simple absent',
      expected: false,
      expr: 'tag:"ABSENT"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Tag avec wildcard présent',
      expected: true,
      expr: 'tag:"ENGIE*"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Tag avec wildcard absent',
      expected: false,
      expr: 'tag:"ABSENT*"',
    },

    // Tests commune
    {
      data: sampleEligibilityData,
      desc: 'Nom de commune exact',
      expected: true,
      expr: 'commune.nom:"Créteil"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Nom de commune différent',
      expected: false,
      expr: 'commune.nom:"Paris"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Code département correct',
      expected: true,
      expr: 'commune.insee_dep:"94"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Code département incorrect',
      expected: false,
      expr: 'commune.insee_dep:"75"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Code commune correct',
      expected: true,
      expr: 'commune.insee_com:"94028"',
    },

    // Tests département
    {
      data: sampleEligibilityData,
      desc: 'Nom de département correct',
      expected: true,
      expr: 'departement.nom:"Val-de-Marne"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Nom de département incorrect',
      expected: false,
      expr: 'departement.nom:"Seine-et-Marne"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Code département par propriété departement',
      expected: true,
      expr: 'departement.insee_dep:"94"',
    },

    // Tests région
    {
      data: sampleEligibilityData,
      desc: 'Nom de région correct',
      expected: true,
      expr: 'region.nom:"Île-de-France"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Nom de région incorrect',
      expected: false,
      expr: 'region.nom:"Auvergne-Rhône-Alpes"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Code région correct',
      expected: true,
      expr: 'region.insee_reg:"11"',
    },

    // Tests EPCI
    {
      data: sampleEligibilityData,
      desc: 'Nom EPCI correct',
      expected: true,
      expr: 'epci.nom:"Métropole du Grand Paris"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Code EPCI correct',
      expected: true,
      expr: 'epci.code:"200054781"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Type EPCI correct',
      expected: true,
      expr: 'epci.type:"METRO"',
    },

    // Tests EPT
    {
      data: sampleEligibilityData,
      desc: 'Nom EPT correct',
      expected: true,
      expr: 'ept.nom:"Établissement public territorial Grand-Orly Seine Bièvre"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Code EPT correct',
      expected: true,
      expr: 'ept.code:"200057958"',
    },

    // Tests type
    {
      data: sampleEligibilityData,
      desc: 'Type correct',
      expected: true,
      expr: 'type:"dans_pdp"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Type incorrect',
      expected: false,
      expr: 'type:"hors_zone"',
    },

    // Tests distance (format corrigé)
    {
      data: sampleEligibilityData,
      desc: 'Distance exacte',
      expected: true,
      expr: 'distance:"0"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Distance inférieure à',
      expected: true,
      expr: 'distance:"<100"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Distance supérieure à (faux)',
      expected: false,
      expr: 'distance:">100"',
    },

    // Tests réseau de chaleur
    {
      data: sampleEligibilityData,
      desc: 'Nom réseau de chaleur correct',
      expected: true,
      expr: 'reseauDeChaleur.nom_reseau:"Réseaux de Créteil - Scuc"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Distance réseau de chaleur',
      expected: true,
      expr: 'reseauDeChaleur.distance:"<50"',
    },

    // Opérateurs logiques
    {
      data: sampleEligibilityData,
      desc: 'ET logique vrai',
      expected: true,
      expr: 'tag:"ENGIE" && commune.insee_dep:"94"',
    },
    {
      data: sampleEligibilityData,
      desc: 'ET logique faux',
      expected: false,
      expr: 'tag:"ENGIE" && commune.insee_dep:"75"',
    },
    {
      data: sampleEligibilityData,
      desc: 'OU logique vrai',
      expected: true,
      expr: 'tag:"ABSENT" || commune.insee_dep:"94"',
    },
    {
      data: sampleEligibilityData,
      desc: 'OU logique faux',
      expected: false,
      expr: 'tag:"ABSENT" || commune.insee_dep:"75"',
    },
    {
      data: sampleEligibilityData,
      desc: 'NON logique vrai',
      expected: true,
      expr: '!tag:"ABSENT"',
    },
    {
      data: sampleEligibilityData,
      desc: 'NON logique faux',
      expected: false,
      expr: '!tag:"ENGIE"',
    },

    // Expressions complexes
    {
      data: sampleEligibilityData,
      desc: 'Expression complexe avec parenthèses',
      expected: true,
      expr: '(tag:"ENGIE*" || tag:"DALKIA*") && commune.insee_dep:"94"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Expression complexe multiple conditions',
      expected: true,
      expr: 'type:"dans_pdp" && distance:"<100" && commune.insee_dep:"94"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Expression complexe avec nouvelles propriétés territoriales',
      expected: true,
      expr: 'region.nom:"Île-de-France" && epci.type:"METRO" && departement.insee_dep:"94"',
    },
  ];

  testCases.forEach(({ expr, data, expected, desc }) => {
    it(desc, () => {
      const ast = parseExpressionToAST(expr);
      const result = evaluateAST(ast, data);
      expect(result).toBe(expected);
    });
  });

  // Tests de validation via testExpression
  const validationCases = [
    {
      data: sampleEligibilityData,
      desc: 'Expression valide avec résultat vrai',
      expectedResult: true,
      expectedValid: true,
      expr: 'tag:"ENGIE"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Expression valide avec résultat faux',
      expectedResult: false,
      expectedValid: true,
      expr: 'tag:"ABSENT"',
    },
    {
      data: sampleEligibilityData,
      desc: 'Expression invalide',
      expectedValid: false,
      expr: 'tag:"ENGIE" &&',
    },
  ];

  validationCases.forEach(({ expr, data, expectedValid, expectedResult, desc }) => {
    it(`testExpression: ${desc}`, () => {
      const result = testExpression(expr, data);
      expect(result.isValid).toBe(expectedValid);
      if (expectedValid && expectedResult !== undefined) {
        expect(result.result).toBe(expectedResult);
      }
    });
  });

  // Tests de parsing des résultats
  describe('parseResultActions', () => {
    it('devrait parser un tag simple', () => {
      const result = parseResultActions('tag:"MonTag"');
      expect(result).toEqual([{ type: 'tag', value: 'MonTag' }]);
    });

    it('devrait parser une affectation simple', () => {
      const result = parseResultActions('affecte:"Gestionnaire"');
      expect(result).toEqual([{ type: 'affecte', value: 'Gestionnaire' }]);
    });

    it('devrait parser des actions multiples', () => {
      const result = parseResultActions('tag:"MonTag" affecte:"Gestionnaire"');
      expect(result).toEqual([
        { type: 'tag', value: 'MonTag' },
        { type: 'affecte', value: 'Gestionnaire' },
      ]);
    });

    it('devrait lancer une erreur pour un format invalide', () => {
      expect(() => parseResultActions('invalide')).toThrow();
    });
  });

  // Tests d'erreur de parsing des conditions
  const errorCases = [
    { desc: 'Erreur: opérateur sans second opérande', expr: 'tag:"ENGIE" &&' },
    { desc: 'Erreur: opérateurs consécutifs', expr: 'tag:"ENGIE" && && tag:"DALKIA"' },
    { desc: 'Erreur: parenthèse ouvrante non fermée', expr: '(tag:"ENGIE" || tag:"DALKIA"' },
    { desc: 'Erreur: parenthèse fermante non ouverte', expr: 'tag:"ENGIE" || tag:"DALKIA")' },
    { desc: 'Erreur: NON sans opérande', expr: 'tag:"ENGIE" && !' },
    { desc: 'Erreur: guillemet non fermé', expr: 'tag:"ENGIE' },
  ];

  errorCases.forEach(({ expr, desc }) => {
    it(desc, () => {
      expect(() => parseExpressionToAST(expr)).toThrow();
    });
  });
});
