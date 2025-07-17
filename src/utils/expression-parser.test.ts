import { describe, expect, it } from 'vitest';

import { evaluateAST, parseExpressionToAST, parseResultActions, testExpression } from './expression-parser';

describe('expression-parser', () => {
  // Données d'éligibilité de test
  const sampleEligibilityData = {
    type: 'dans_pdp',
    distance: 0,
    id_sncu: '9402C',
    nom: 'Réseaux de Créteil - Scuc',
    tags: ['ENGIE', 'ENGIE_IDF', 'DALKIA', 'Dalkia', 'Dalkia_IDF', 'Dalkia_9402C'],
    communes: ['Créteil'],
    commune: {
      nom: 'Créteil',
      insee_com: '94028',
      insee_dep: '94',
      insee_reg: '11',
    },
    reseauDeChaleur: {
      id_fcu: 296,
      'Identifiant reseau': '9402C',
      nom_reseau: 'Réseaux de Créteil - Scuc',
      tags: ['Dalkia', 'Dalkia_IDF', 'Dalkia_9402C'],
      communes: ['Créteil'],
      distance: 29,
    },
    reseauEnConstruction: {
      id_fcu: 158,
      nom_reseau: null,
      tags: ['SIPPEREC', 'SIPPEREC_BLR'],
      communes: ['Bourg-la-Reine'],
      distance: 8752,
    },
  };

  // Tests de parsing et d'évaluation - Nouvelle syntaxe
  const testCases = [
    // Tests tags
    {
      expr: 'tag:"ENGIE"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Tag simple présent',
    },
    {
      expr: 'tag:"ABSENT"',
      data: sampleEligibilityData,
      expected: false,
      desc: 'Tag simple absent',
    },
    {
      expr: 'tag:"ENGIE*"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Tag avec wildcard présent',
    },
    {
      expr: 'tag:"ABSENT*"',
      data: sampleEligibilityData,
      expected: false,
      desc: 'Tag avec wildcard absent',
    },

    // Tests commune
    {
      expr: 'commune.nom:"Créteil"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Nom de commune exact',
    },
    {
      expr: 'commune.nom:"Paris"',
      data: sampleEligibilityData,
      expected: false,
      desc: 'Nom de commune différent',
    },
    {
      expr: 'commune.insee_dep:"94"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Code département correct',
    },
    {
      expr: 'commune.insee_dep:"75"',
      data: sampleEligibilityData,
      expected: false,
      desc: 'Code département incorrect',
    },
    {
      expr: 'commune.insee_com:"94028"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Code commune correct',
    },

    // Tests type
    {
      expr: 'type:"dans_pdp"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Type correct',
    },
    {
      expr: 'type:"hors_zone"',
      data: sampleEligibilityData,
      expected: false,
      desc: 'Type incorrect',
    },

    // Tests distance (format corrigé)
    {
      expr: 'distance:"0"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Distance exacte',
    },
    {
      expr: 'distance:"<100"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Distance inférieure à',
    },
    {
      expr: 'distance:">100"',
      data: sampleEligibilityData,
      expected: false,
      desc: 'Distance supérieure à (faux)',
    },

    // Tests réseau de chaleur
    {
      expr: 'reseauDeChaleur.nom_reseau:"Réseaux de Créteil - Scuc"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Nom réseau de chaleur correct',
    },
    {
      expr: 'reseauDeChaleur.distance:"<50"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Distance réseau de chaleur',
    },

    // Opérateurs logiques
    {
      expr: 'tag:"ENGIE" && commune.insee_dep:"94"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'ET logique vrai',
    },
    {
      expr: 'tag:"ENGIE" && commune.insee_dep:"75"',
      data: sampleEligibilityData,
      expected: false,
      desc: 'ET logique faux',
    },
    {
      expr: 'tag:"ABSENT" || commune.insee_dep:"94"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'OU logique vrai',
    },
    {
      expr: 'tag:"ABSENT" || commune.insee_dep:"75"',
      data: sampleEligibilityData,
      expected: false,
      desc: 'OU logique faux',
    },
    {
      expr: '!tag:"ABSENT"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'NON logique vrai',
    },
    {
      expr: '!tag:"ENGIE"',
      data: sampleEligibilityData,
      expected: false,
      desc: 'NON logique faux',
    },

    // Expressions complexes
    {
      expr: '(tag:"ENGIE*" || tag:"DALKIA*") && commune.insee_dep:"94"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Expression complexe avec parenthèses',
    },
    {
      expr: 'type:"dans_pdp" && distance:"<100" && commune.insee_dep:"94"',
      data: sampleEligibilityData,
      expected: true,
      desc: 'Expression complexe multiple conditions',
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
      expr: 'tag:"ENGIE"',
      data: sampleEligibilityData,
      expectedValid: true,
      expectedResult: true,
      desc: 'Expression valide avec résultat vrai',
    },
    {
      expr: 'tag:"ABSENT"',
      data: sampleEligibilityData,
      expectedValid: true,
      expectedResult: false,
      desc: 'Expression valide avec résultat faux',
    },
    {
      expr: 'tag:"ENGIE" &&',
      data: sampleEligibilityData,
      expectedValid: false,
      desc: 'Expression invalide',
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
    { expr: 'tag:"ENGIE" &&', desc: 'Erreur: opérateur sans second opérande' },
    { expr: 'tag:"ENGIE" && && tag:"DALKIA"', desc: 'Erreur: opérateurs consécutifs' },
    { expr: '(tag:"ENGIE" || tag:"DALKIA"', desc: 'Erreur: parenthèse ouvrante non fermée' },
    { expr: 'tag:"ENGIE" || tag:"DALKIA")', desc: 'Erreur: parenthèse fermante non ouverte' },
    { expr: 'tag:"ENGIE" && !', desc: 'Erreur: NON sans opérande' },
    { expr: 'tag:"ENGIE', desc: 'Erreur: guillemet non fermé' },
  ];

  errorCases.forEach(({ expr, desc }) => {
    it(desc, () => {
      expect(() => parseExpressionToAST(expr)).toThrow();
    });
  });
});
