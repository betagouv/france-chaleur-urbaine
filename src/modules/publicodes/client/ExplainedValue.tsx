import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useState } from 'react';

import cx from '@/utils/cx';

import type { FCUEngine } from '../explanation-model';
import { formatNodeValue, formatUnit } from '../format';
import { RuleExplanationDialog } from './RuleExplanationDialog';

type ExplainedValueProps = {
  engine: FCUEngine;
  dottedName: RuleName;
  className?: string;
};

/**
 * Renders the evaluated value of a publicodes rule as a clickable element
 * that opens an explanation dialog detailing how the value is computed.
 */
export function ExplainedValue({ engine, dottedName, className }: ExplainedValueProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const evaluated = engine.evaluate(dottedName);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        title={`Comprendre le calcul de « ${dottedName} »`}
        className={cx(
          'cursor-pointer whitespace-nowrap border border-gray-300 bg-white px-1.5 py-0.5 tabular-nums transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700',
          className
        )}
      >
        {formatNodeValue(evaluated.nodeValue)}
        {evaluated.unit && <span className="ml-1 text-xs text-gray-500">{formatUnit(evaluated.unit)}</span>}
      </button>
      {isDialogOpen && <RuleExplanationDialog engine={engine} dottedName={dottedName} open={isDialogOpen} onOpenChange={setIsDialogOpen} />}
    </>
  );
}
