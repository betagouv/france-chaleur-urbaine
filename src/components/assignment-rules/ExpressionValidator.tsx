import { type ReactNode } from 'react';

import cx from '@/utils/cx';
import { type ASTNode, validateExpression } from '@/utils/expression-parser';

export type ExpressionValidatorProps = {
  expression: string;
  className?: string;
  showAST?: boolean;
};

const ExpressionValidator = ({ expression, className, showAST = false }: ExpressionValidatorProps) => {
  const validation = validateExpression(expression);

  if (!expression.trim()) {
    return null;
  }

  const renderAST = (ast: ASTNode, depth = 0): ReactNode => {
    const indent = '  '.repeat(depth);

    switch (ast.type) {
      case 'tag':
        return (
          <div className="font-mono text-sm">
            {indent}Tag: {ast.value}
          </div>
        );
      case 'not':
        return (
          <div>
            <div className="font-mono text-sm">{indent}NOT:</div>
            {renderAST(ast.operand, depth + 1)}
          </div>
        );
      case 'and':
        return (
          <div>
            <div className="font-mono text-sm">{indent}AND:</div>
            {renderAST(ast.left, depth + 1)}
            {renderAST(ast.right, depth + 1)}
          </div>
        );
      case 'or':
        return (
          <div>
            <div className="font-mono text-sm">{indent}OR:</div>
            {renderAST(ast.left, depth + 1)}
            {renderAST(ast.right, depth + 1)}
          </div>
        );
    }
  };

  return (
    <div className={cx('mt-2 p-3 rounded border', className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cx('w-3 h-3 rounded-full', validation.isValid ? 'bg-green-500' : 'bg-red-500')} />
        <span className="text-sm font-medium">{validation.isValid ? 'Expression valide' : 'Expression invalide'}</span>
      </div>

      {!validation.isValid && validation.error && (
        <div className="text-sm text-red-600 mb-2">
          <strong>Erreur :</strong> {validation.error}
        </div>
      )}

      {validation.isValid && showAST && validation.ast && (
        <div className="mt-2">
          <div className="text-sm font-medium mb-1">AST généré :</div>
          <div className="bg-gray-50 p-2 rounded text-xs">{renderAST(validation.ast)}</div>
        </div>
      )}

      {validation.isValid && (
        <div className="text-sm text-gray-600">
          <div className="mb-1">
            <strong>Opérateurs supportés :</strong>
          </div>
          <div className="space-y-1">
            <div>
              • <code className="bg-gray-100 px-1 rounded">&&</code> : ET logique
            </div>
            <div>
              • <code className="bg-gray-100 px-1 rounded">||</code> : OU logique
            </div>
            <div>
              • <code className="bg-gray-100 px-1 rounded">!</code> : NON logique
            </div>
            <div>
              • <code className="bg-gray-100 px-1 rounded">()</code> : Parenthèses pour la priorité
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpressionValidator;
