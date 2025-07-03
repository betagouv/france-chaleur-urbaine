import { describe, expect, it } from 'vitest';

import { evaluateAST, parseExpressionToAST } from './expression-parser';

describe('expression-parser', () => {
  // Tests de parsing et d'évaluation
  const testCases = [
    // Tags simples
    { expr: 'Tag1', values: ['Tag1'], expected: true, desc: 'Tag simple sans guillemets présent' },
    { expr: 'Tag1', values: ['AutreTag'], expected: false, desc: 'Tag simple sans guillemets absent' },
    { expr: '"Tag1"', values: ['Tag1'], expected: true, desc: 'Tag simple avec guillemets présent' },
    { expr: '"Tag1"', values: ['AutreTag'], expected: false, desc: 'Tag simple avec guillemets absent' },

    // Opérateurs logiques
    { expr: 'Tag1 && Tag2', values: ['Tag1', 'Tag2'], expected: true, desc: 'ET sans guillemets' },
    { expr: 'Tag1 && Tag2', values: ['Tag1'], expected: false, desc: 'ET sans guillemets, un seul présent' },
    { expr: '"Tag1" && "Tag2"', values: ['Tag1', 'Tag2'], expected: true, desc: 'ET avec guillemets' },
    { expr: 'Tag1 || Tag2', values: ['Tag2'], expected: true, desc: 'OU sans guillemets' },
    { expr: '"Tag1" || "Tag2"', values: ['Tag3'], expected: false, desc: 'OU avec guillemets, aucun présent' },
    { expr: 'Tag1 && !Tag2', values: ['Tag1'], expected: true, desc: 'NON sans guillemets' },
    { expr: 'Tag1 && !Tag2', values: ['Tag1', 'Tag2'], expected: false, desc: 'NON sans guillemets, tag exclu présent' },
    { expr: '!(Tag1 || Tag2)', values: ['Tag3'], expected: true, desc: 'NON parenthèses sans guillemets' },
    { expr: '(Tag1 || Tag2) && Tag3', values: ['Tag1', 'Tag3'], expected: true, desc: 'Parenthèses sans guillemets' },

    // Tags avec espaces (doivent être entre guillemets)
    { expr: '"Tag avec espaces"', values: ['Tag avec espaces'], expected: true, desc: 'Tag avec espaces présent' },
    { expr: '"Tag avec espaces"', values: ['TagSansEspaces'], expected: false, desc: 'Tag avec espaces absent' },
    { expr: '"Tag 1" && "Tag 2"', values: ['Tag 1', 'Tag 2'], expected: true, desc: 'ET avec espaces' },
    { expr: '"Tag 1" || "Tag 2"', values: ['Tag 2'], expected: true, desc: 'OU avec espaces' },
    { expr: '("Tag A" || "Tag B") && "Tag C"', values: ['Tag A', 'Tag C'], expected: true, desc: 'Parenthèses avec espaces' },
  ];

  testCases.forEach(({ expr, values, expected, desc }) => {
    it(desc, () => {
      const ast = parseExpressionToAST(expr);
      const result = evaluateAST(ast, values);
      expect(result).toBe(expected);
    });
  });

  // Tests d'erreur de parsing
  const errorCases = [
    { expr: 'Tag1 &&', desc: 'Erreur: opérateur sans second opérande' },
    { expr: 'Tag1 && && Tag2', desc: 'Erreur: opérateurs consécutifs' },
    { expr: '(Tag1 || Tag2', desc: 'Erreur: parenthèse ouvrante non fermée' },
    { expr: 'Tag1 || Tag2)', desc: 'Erreur: parenthèse fermante non ouverte' },
    { expr: 'Tag1 && !', desc: 'Erreur: NON sans opérande' },
    { expr: '"Tag1', desc: 'Erreur: guillemet non fermé' },
    { expr: '"Tag avec espaces', desc: 'Erreur: guillemet non fermé avec espaces' },
  ];

  errorCases.forEach(({ expr, desc }) => {
    it(desc, () => {
      expect(() => parseExpressionToAST(expr)).toThrow();
    });
  });
});
