import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Récupérer toutes les règles existantes
  const existingRules = await knex('assignment_rules').select('id', 'search_pattern', 'result');

  // Convertir chaque règle
  for (const rule of existingRules) {
    // Convertir le search_pattern : ajouter tag: devant chaque terme qui n'est pas un opérateur
    const convertedSearchPattern = convertSearchPatternToExtendedSyntax(rule.search_pattern);

    // Convertir le result : ajouter affecte: devant
    const convertedResult = `affecte:"${rule.result}"`;

    // Mettre à jour la règle
    await knex('assignment_rules').where('id', rule.id).update({
      search_pattern: convertedSearchPattern,
      result: convertedResult,
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Récupérer toutes les règles converties
  const convertedRules = await knex('assignment_rules').select('id', 'search_pattern', 'result');

  // Reconvertir chaque règle vers l'ancien format
  for (const rule of convertedRules) {
    // Reconvertir le search_pattern : enlever tag: devant chaque terme
    const revertedSearchPattern = revertSearchPatternFromExtendedSyntax(rule.search_pattern);

    // Reconvertir le result : enlever affecte: et les guillemets
    const match = rule.result.match(/^affecte:"(.+)"$/);
    const revertedResult = match ? match[1] : rule.result;

    // Mettre à jour la règle
    await knex('assignment_rules').where('id', rule.id).update({
      search_pattern: revertedSearchPattern,
      result: revertedResult,
    });
  }
}

/**
 * Convertit un search_pattern de l'ancien format vers le nouveau format
 * Ex: "ENGIE*" && "SIPPEREC" -> tag:"ENGIE*" && tag:"SIPPEREC"
 */
function convertSearchPatternToExtendedSyntax(pattern: string): string {
  // Regex pour identifier les tokens qui ne sont pas des opérateurs ou parenthèses
  // On cherche les chaînes entre guillemets ou les mots sans guillemets (avec support Unicode)
  return pattern.replace(/"([^"]+)"|([A-Za-z\u00C0-\u017F0-9_*-]+)/g, (match, quoted, unquoted) => {
    if (quoted) {
      // Chaîne entre guillemets : "value" -> tag:"value"
      return `tag:"${quoted}"`;
    } else if (unquoted && !['&&', '||', '!'].includes(unquoted)) {
      // Mot sans guillemets qui n'est pas un opérateur : value -> tag:"value"
      return `tag:"${unquoted}"`;
    }
    return match;
  });
}

/**
 * Reconvertit un search_pattern du nouveau format vers l'ancien format
 * Ex: tag:"ENGIE*" && tag:"SIPPEREC" -> "ENGIE*" && "SIPPEREC"
 */
function revertSearchPatternFromExtendedSyntax(pattern: string): string {
  // Remplace tag:"value" par "value"
  return pattern.replace(/tag:"([^"]+)"/g, '"$1"');
}
