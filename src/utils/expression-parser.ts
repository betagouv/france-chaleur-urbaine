// Types pour l'AST (Abstract Syntax Tree)
export type ASTNode =
  | { type: 'condition'; field: string; value: string; hasWildcard: boolean }
  | { type: 'not'; operand: ASTNode }
  | { type: 'and'; left: ASTNode; right: ASTNode }
  | { type: 'or'; left: ASTNode; right: ASTNode };

// Types pour les résultats
export type ResultAction = { type: 'tag'; value: string } | { type: 'affecte'; value: string };

// Token types pour le lexer
type Token =
  | { type: 'condition'; field: string; value: string; hasWildcard: boolean }
  | { type: 'operator'; value: '&&' | '||' | '!' }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'whitespace' };

/**
 * Fonction utilitaire pour faire correspondre un pattern avec wildcard à une valeur
 */
function matchesWildcard(pattern: string, value: string): boolean {
  // Si pas de wildcard, correspondance exacte
  if (!pattern.includes('*')) {
    return pattern === value;
  }

  // Pattern avec wildcard
  const parts = pattern.split('*');

  // Cas: "Tag*" (wildcard à la fin)
  if (parts.length === 2 && parts[1] === '') {
    return value.startsWith(parts[0]);
  }

  // Cas: "*Tag" (wildcard au début)
  if (parts.length === 2 && parts[0] === '') {
    return value.endsWith(parts[1]);
  }

  // Cas: "*Tag*" (wildcard au début et à la fin)
  if (parts.length === 3 && parts[0] === '' && parts[2] === '') {
    return value.includes(parts[1]);
  }

  // Cas: "Tag*Value" (wildcard au milieu)
  if (parts.length === 3) {
    return value.startsWith(parts[0]) && value.endsWith(parts[2]);
  }

  // Autres cas complexes avec plusieurs wildcards
  const regexPattern = pattern
    .replace(/\*/g, '.*') // Remplacer * par .* pour regex
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Échapper les caractères spéciaux regex

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(value);
}

/**
 * Lexer pour tokeniser l'expression
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let current = 0;

  while (current < expression.length) {
    const char = expression[current];

    // Ignorer les espaces
    if (/\s/.test(char)) {
      tokens.push({ type: 'whitespace' });
      current++;
      continue;
    }

    // Parenthèses
    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char as '(' | ')' });
      current++;
      continue;
    }

    // Opérateurs
    if (char === '!') {
      tokens.push({ type: 'operator', value: '!' });
      current++;
      continue;
    }

    if (char === '&' && expression[current + 1] === '&') {
      tokens.push({ type: 'operator', value: '&&' });
      current += 2;
      continue;
    }

    if (char === '|' && expression[current + 1] === '|') {
      tokens.push({ type: 'operator', value: '||' });
      current += 2;
      continue;
    }

    // Conditions (field:"value")
    if (/[a-zA-Z_]/.test(char)) {
      let field = '';

      // Lire le nom du champ (peut contenir des points pour les propriétés imbriquées)
      while (current < expression.length && /[a-zA-Z0-9_.]/.test(expression[current])) {
        field += expression[current];
        current++;
      }

      // Vérifier qu'on a bien ':'
      if (current < expression.length && expression[current] === ':') {
        current++; // Consommer ':'

        // Vérifier qu'on a bien '"'
        if (current < expression.length && expression[current] === '"') {
          current++; // Consommer le guillemet ouvrant
          let value = '';

          while (current < expression.length && expression[current] !== '"') {
            value += expression[current];
            current++;
          }

          if (current >= expression.length) {
            throw new Error(`Guillemet fermant manquant pour la condition: ${field}:"${value}`);
          }

          current++; // Consommer le guillemet fermant
          tokens.push({
            type: 'condition',
            field,
            value,
            hasWildcard: value.includes('*'),
          });
          continue;
        } else {
          throw new Error(`Valeur manquante pour le champ: ${field}. Format attendu: ${field}:"valeur"`);
        }
      } else {
        throw new Error(`Caractère ':' manquant après le champ: ${field}. Format attendu: ${field}:"valeur"`);
      }
    }

    // Caractère non reconnu
    throw new Error(`Caractère non reconnu: ${char} à la position ${current}`);
  }

  return tokens.filter((token) => token.type !== 'whitespace');
}

/**
 * Parser récursif pour construire l'AST
 */
function parseExpression(tokens: Token[], index: { value: number }): ASTNode {
  let left = parseTerm(tokens, index);

  while (index.value < tokens.length && tokens[index.value]?.type === 'operator' && (tokens[index.value] as any)?.value === '||') {
    index.value++; // Consommer '||'
    const right = parseTerm(tokens, index);
    left = { type: 'or', left, right };
  }

  return left;
}

function parseTerm(tokens: Token[], index: { value: number }): ASTNode {
  let left = parseFactor(tokens, index);

  while (index.value < tokens.length && tokens[index.value]?.type === 'operator' && (tokens[index.value] as any)?.value === '&&') {
    index.value++; // Consommer '&&'
    const right = parseFactor(tokens, index);
    left = { type: 'and', left, right };
  }

  return left;
}

function parseFactor(tokens: Token[], index: { value: number }): ASTNode {
  if (index.value >= tokens.length) {
    throw new Error('Expression inattendue');
  }

  const token = tokens[index.value];

  if (token.type === 'operator' && (token as any).value === '!') {
    index.value++; // Consommer '!'
    const operand = parseFactor(tokens, index);
    return { type: 'not', operand };
  }

  if (token.type === 'paren' && (token as any).value === '(') {
    index.value++; // Consommer '('
    const expression = parseExpression(tokens, index);

    if (index.value >= tokens.length || tokens[index.value]?.type !== 'paren' || (tokens[index.value] as any)?.value !== ')') {
      throw new Error('Parenthèse fermante manquante');
    }
    index.value++; // Consommer ')'

    return expression;
  }

  if (token.type === 'condition') {
    const conditionToken = token as any;
    index.value++; // Consommer la condition
    return {
      type: 'condition',
      field: conditionToken.field,
      value: conditionToken.value,
      hasWildcard: conditionToken.hasWildcard,
    };
  }

  throw new Error(`Token inattendu: ${token.type} à la position ${index.value}`);
}

/**
 * Parse une expression string en AST
 */
export function parseExpressionToAST(expression: string): ASTNode {
  try {
    const tokens = tokenize(expression);
    const index = { value: 0 };
    const ast = parseExpression(tokens, index);

    if (index.value < tokens.length) {
      throw new Error('Expression non complètement parsée');
    }

    return ast;
  } catch (error) {
    throw new Error(`Erreur de parsing: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Parse une string de résultat en actions
 */
export function parseResultActions(result: string): ResultAction[] {
  const actions: ResultAction[] = [];

  // Regex pour matcher tag:"value" ou affecte:"value"
  const regex = /(tag|affecte):"([^"]+)"/g;
  let match;

  while ((match = regex.exec(result)) !== null) {
    const [, type, value] = match;
    if (type === 'tag' || type === 'affecte') {
      actions.push({ type, value });
    }
  }

  if (actions.length === 0) {
    throw new Error(`Format de résultat invalide: ${result}. Format attendu: tag:"valeur" ou affecte:"valeur"`);
  }

  return actions;
}

/**
 * Récupère une valeur dans un objet via un chemin (ex: "commune.nom")
 */
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
}

/**
 * Évalue un AST sur les données d'éligibilité détaillées
 */
export function evaluateAST(ast: ASTNode, eligibilityData: any): boolean {
  switch (ast.type) {
    case 'condition': {
      // Mapper 'tag' vers 'tags' dans les données
      const fieldPath = ast.field === 'tag' ? 'tags' : ast.field;
      const value = getValueByPath(eligibilityData, fieldPath);

      if (value === undefined || value === null) {
        return false;
      }

      // Cas spécial pour les tags (array)
      if (ast.field === 'tag' && Array.isArray(value)) {
        if (ast.hasWildcard) {
          return value.some((tag: string) => matchesWildcard(ast.value, tag));
        } else {
          return value.includes(ast.value);
        }
      }

      // Cas spécial pour les communes (array)
      if (ast.field === 'communes' && Array.isArray(value)) {
        if (ast.hasWildcard) {
          return value.some((commune: string) => matchesWildcard(ast.value, commune));
        } else {
          return value.includes(ast.value);
        }
      }

      // Pour les comparaisons numériques avec opérateurs (<, >, <=, >=, =)
      if (typeof value === 'number' && (ast.value.startsWith('<') || ast.value.startsWith('>') || ast.value.startsWith('='))) {
        const operator = ast.value.charAt(0);
        const comparisonValue = parseFloat(ast.value.substring(1));

        if (isNaN(comparisonValue)) {
          return false;
        }

        switch (operator) {
          case '<':
            return value < comparisonValue;
          case '>':
            return value > comparisonValue;
          case '=':
            return value === comparisonValue;
          default:
            return false;
        }
      }

      // Cas général (string, number, etc.)
      const stringValue = String(value);
      if (ast.hasWildcard) {
        return matchesWildcard(ast.value, stringValue);
      } else {
        return stringValue === ast.value;
      }
    }

    case 'not':
      return !evaluateAST(ast.operand, eligibilityData);

    case 'and':
      return evaluateAST(ast.left, eligibilityData) && evaluateAST(ast.right, eligibilityData);

    case 'or':
      return evaluateAST(ast.left, eligibilityData) || evaluateAST(ast.right, eligibilityData);

    default:
      throw new Error(`Type de nœud AST non supporté: ${(ast as any).type}`);
  }
}

/**
 * Valide une expression et retourne un objet avec le statut et les détails
 */
export function validateExpression(expression: string): { isValid: boolean; error?: string; ast?: ASTNode } {
  try {
    const ast = parseExpressionToAST(expression);
    return { isValid: true, ast };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Erreur de validation inconnue',
    };
  }
}

/**
 * Valide une string de résultat
 */
export function validateResult(result: string): { isValid: boolean; error?: string; actions?: ResultAction[] } {
  try {
    const actions = parseResultActions(result);
    return { isValid: true, actions };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Erreur de validation inconnue',
    };
  }
}

/**
 * Teste une expression sur des données d'éligibilité
 */
export function testExpression(expression: string, eligibilityData: any): { isValid: boolean; error?: string; result?: boolean } {
  const validation = validateExpression(expression);
  if (!validation.isValid) {
    return validation;
  }

  try {
    const result = evaluateAST(validation.ast!, eligibilityData);
    return { isValid: true, result };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Erreur d'évaluation inconnue",
    };
  }
}
