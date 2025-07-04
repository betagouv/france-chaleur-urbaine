// Types pour l'AST (Abstract Syntax Tree)
export type ASTNode =
  | { type: 'tag'; value: string; hasWildcard: boolean }
  | { type: 'not'; operand: ASTNode }
  | { type: 'and'; left: ASTNode; right: ASTNode }
  | { type: 'or'; left: ASTNode; right: ASTNode };

// Token types pour le lexer
type Token =
  | { type: 'tag'; value: string; hasWildcard: boolean }
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

    // Tags (chaînes entre guillemets)
    if (char === '"') {
      let tag = '';
      current++; // Consommer le guillemet ouvrant

      while (current < expression.length && expression[current] !== '"') {
        tag += expression[current];
        current++;
      }

      if (current >= expression.length) {
        throw new Error(`Guillemet fermant manquant pour le tag: ${tag}`);
      }

      current++; // Consommer le guillemet fermant
      tokens.push({ type: 'tag', value: tag, hasWildcard: tag.includes('*') });
      continue;
    }

    // Tags sans guillemets (séquence de caractères non-espace, non-opérateur, non-parenthèse)
    if (![' ', '\t', '\n', '(', ')', '!', '&', '|', '"'].includes(char)) {
      let tag = '';
      while (current < expression.length && ![' ', '\t', '\n', '(', ')', '!', '&', '|', '"'].includes(expression[current])) {
        tag += expression[current];
        current++;
      }
      tokens.push({ type: 'tag', value: tag, hasWildcard: tag.includes('*') });
      continue;
    }

    // Caractère non reconnu
    throw new Error(`Caractère non reconnu: ${char} à la position ${current}`);
  }

  return tokens.filter((token) => token.type !== 'whitespace');
}

/**
 * Parser récursif pour construire l'AST
 * Utilise la grammaire: expression -> term ('||' term)*
 *                      term -> factor ('&&' factor)*
 *                      factor -> '!' factor | '(' expression ')' | tag
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

  if (token.type === 'tag') {
    const tagToken = token as any;
    index.value++; // Consommer le tag
    return { type: 'tag', value: tagToken.value, hasWildcard: tagToken.hasWildcard };
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
 * Évalue un AST sur une liste de valeurs
 */
export function evaluateAST(ast: ASTNode, values: string[]): boolean {
  switch (ast.type) {
    case 'tag':
      if (ast.hasWildcard) {
        // Utiliser la correspondance avec wildcard
        return values.some((value) => matchesWildcard(ast.value, value));
      } else {
        // Correspondance exacte (comportement original)
        return values.includes(ast.value);
      }

    case 'not':
      return !evaluateAST(ast.operand, values);

    case 'and':
      return evaluateAST(ast.left, values) && evaluateAST(ast.right, values);

    case 'or':
      return evaluateAST(ast.left, values) || evaluateAST(ast.right, values);

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
 * Teste une expression sur une liste de valeurs
 */
export function testExpression(expression: string, values: string[]): { isValid: boolean; error?: string; result?: boolean } {
  const validation = validateExpression(expression);
  if (!validation.isValid) {
    return validation;
  }

  try {
    const result = evaluateAST(validation.ast!, values);
    return { isValid: true, result };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Erreur d'évaluation inconnue",
    };
  }
}
