import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { Fragment, useEffect, useMemo, useState } from 'react';

import Dialog from '@/components/ui/Dialog';

import { buildReferenceNode, buildRuleExplanation, type FCUEngine, getRuleUsages } from '../explanation-model';
import { formatNodeValue } from '../format';
import { ExplanationNodeView } from './ExplanationNodeView';
import { ExplanationNavigationContext } from './explanation-navigation';

type RuleExplanationDialogProps = {
  engine: FCUEngine;
  dottedName: RuleName;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Rule browser dialog: explains how a publicodes rule value is computed (formula tree
 * with inline drill-down) and lets the user navigate between rules — "open" buttons on
 * rule rows and a "used by" section push onto a breadcrumb history.
 */
export function RuleExplanationDialog({ engine, dottedName, open, onOpenChange }: RuleExplanationDialogProps) {
  const [history, setHistory] = useState<RuleName[]>([dottedName]);
  const currentRule = history.at(-1) ?? dottedName;

  // Réinitialise la navigation à chaque (ré)ouverture ou changement de règle racine
  useEffect(() => {
    setHistory([dottedName]);
  }, [dottedName, open]);

  const explanation = useMemo(() => (open ? buildRuleExplanation(engine, currentRule) : null), [engine, currentRule, open]);
  const usages = useMemo(() => (open ? getRuleUsages(engine, currentRule) : []), [engine, currentRule, open]);

  const navigateToRule = (rule: RuleName) => {
    if (rule !== currentRule) {
      setHistory([...history, rule]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={currentRule} size="xl">
      {explanation && (
        <ExplanationNavigationContext.Provider value={navigateToRule}>
          <div className="flex flex-col gap-4">
            {history.length > 1 && (
              <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
                {history.map((rule, ruleIndex) =>
                  ruleIndex < history.length - 1 ? (
                    <Fragment key={ruleIndex}>
                      <button
                        type="button"
                        onClick={() => setHistory(history.slice(0, ruleIndex + 1))}
                        className="cursor-pointer underline hover:text-blue-600"
                      >
                        {rule}
                      </button>
                      <span>›</span>
                    </Fragment>
                  ) : (
                    <span key={ruleIndex} className="font-medium text-gray-700">
                      {rule}
                    </span>
                  )
                )}
              </nav>
            )}

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-2xl font-bold tabular-nums">
                {formatNodeValue(explanation.value)}
                {explanation.unit && <span className="ml-1.5 text-base font-normal text-gray-500">{explanation.unit}</span>}
              </span>
              {explanation.provenance === 'situation' && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">valeur saisie</span>
              )}
              {explanation.provenance === 'default' && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">valeur par défaut</span>
              )}
            </div>

            {explanation.description && <p className="mb-0 text-sm text-gray-600">{explanation.description}</p>}

            {explanation.formula ? (
              <div className="overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Comment cette valeur est calculée</div>
                <div className="min-w-fit">
                  <ExplanationNodeView node={explanation.formula} engine={engine} />
                </div>
              </div>
            ) : (
              <p className="mb-0 text-sm text-gray-600">
                {explanation.overriddenModelValue !== undefined ? (
                  <>
                    Cette valeur provient de la situation et remplace la valeur du modèle :{' '}
                    <span className="font-medium tabular-nums text-gray-900">
                      {formatNodeValue(explanation.overriddenModelValue)}
                      {explanation.unit && <span className="ml-1 text-xs font-normal text-gray-500">{explanation.unit}</span>}
                    </span>
                  </>
                ) : explanation.provenance === 'situation' ? (
                  'Cette valeur provient directement de la situation (saisie utilisateur ou donnée du contexte).'
                ) : (
                  'Cette valeur est une constante du modèle.'
                )}
              </p>
            )}

            {usages.length > 0 && (
              <div className="overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Utilisée par</div>
                <div className="flex min-w-fit flex-col gap-1">
                  {usages.map((usage) => (
                    <ExplanationNodeView key={usage} node={buildReferenceNode(engine, usage)} engine={engine} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ExplanationNavigationContext.Provider>
      )}
    </Dialog>
  );
}
