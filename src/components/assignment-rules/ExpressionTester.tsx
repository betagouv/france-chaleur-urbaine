import { type ReactNode, useState } from 'react';

import Button from '@/components/ui/Button';
import cx from '@/utils/cx';
import { testExpression } from '@/utils/expression-parser';

export type ExpressionTesterProps = {
  expression: string;
  className?: string;
};

const ExpressionTester = ({ expression, className }: ExpressionTesterProps) => {
  const [testValues, setTestValues] = useState<string>('');
  const [testResult, setTestResult] = useState<{ isValid: boolean; error?: string; result?: boolean } | null>(null);

  const handleTest = () => {
    if (!expression.trim()) {
      setTestResult(null);
      return;
    }

    const values = testValues
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    const result = testExpression(expression, values);
    setTestResult(result);
  };

  const handleClear = () => {
    setTestValues('');
    setTestResult(null);
  };

  const renderResult = (): ReactNode => {
    if (!testResult) return null;

    if (!testResult.isValid) {
      return (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <div className="text-sm text-red-800">
            <strong>Erreur :</strong> {testResult.error}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="text-sm text-blue-800">
          <strong>Résultat :</strong> {testResult.result ? 'Vrai' : 'Faux'}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          L'expression est valide et retourne {testResult.result ? 'true' : 'false'} avec les valeurs fournies.
        </div>
      </div>
    );
  };

  if (!expression.trim()) {
    return null;
  }

  return (
    <div className={cx('mt-3 p-3 bg-gray-50 border rounded', className)}>
      <div className="text-sm font-medium mb-2">Tester l'expression</div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Valeurs à tester (séparées par des virgules)</label>
          <input
            type="text"
            value={testValues}
            onChange={(e) => setTestValues(e.target.value)}
            placeholder="Ex: Tag1, Tag2, Tag3"
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleTest()}
          />
          <div className="text-xs text-gray-500 mt-1">
            Utilisez des astérisques (*) dans l'expression pour des correspondances partielles. Ex: "ENGIE*" correspond à "ENGIE_1",
            "ENGIE_2", etc.
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="small" onClick={handleTest} disabled={!expression.trim()}>
            Tester
          </Button>
          <Button size="small" priority="secondary" onClick={handleClear}>
            Effacer
          </Button>
        </div>
      </div>

      {renderResult()}
    </div>
  );
};

export default ExpressionTester;
