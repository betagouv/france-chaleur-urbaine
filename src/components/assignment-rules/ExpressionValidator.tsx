import cx from '@/utils/cx';
import { validateExpression } from '@/utils/expression-parser';

export type ExpressionValidatorProps = {
  expression: string;
  className?: string;
};

const ExpressionValidator = ({ expression, className }: ExpressionValidatorProps) => {
  const validation = validateExpression(expression);

  return (
    <div className={cx('mt-2 p-3 rounded border', className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cx('w-3 h-3 rounded-full', validation.isValid ? 'bg-green-500' : 'bg-error')} />
        <span className="text-sm font-medium">{validation.isValid ? 'Expression valide' : 'Expression invalide'}</span>
      </div>

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
    </div>
  );
};

export default ExpressionValidator;
