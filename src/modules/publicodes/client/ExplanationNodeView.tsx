import { Fragment, useContext, useState } from 'react';

import Icon from '@/components/ui/Icon';
import cx from '@/utils/cx';

import {
  buildRuleExplanation,
  COMPARISON_OPERATORS,
  type ExplanationNode,
  type ExplanationVariationCase,
  type FCUEngine,
} from '../explanation-model';
import { formatNodeValue } from '../format';
import { ExplanationNavigationContext } from './explanation-navigation';

const OPERATOR_SYMBOLS: Record<string, string> = { '-': '−', '*': '×', '**': '^', '/': '÷', '//': '÷' };

const OPERATION_LABELS: Record<string, string> = {
  '-': 'soustraction',
  '*': 'produit',
  '**': 'puissance',
  '/': 'division',
  '//': 'division entière',
  '+': 'somme',
  et: 'toutes ces conditions',
  ou: 'une de ces conditions',
};

type OperationStyle = { chip: string; border: string; symbol: string };

// Code couleur : sommes en bleu, produits en violet, logique booléenne en bleu clair, conditions en orange
const BLUE_STYLE: OperationStyle = { border: 'border-blue-200', chip: 'bg-blue-100 text-blue-800', symbol: 'text-blue-700' };
const PURPLE_STYLE: OperationStyle = { border: 'border-purple-200', chip: 'bg-purple-100 text-purple-800', symbol: 'text-purple-700' };
const ORANGE_STYLE: OperationStyle = { border: 'border-orange-200', chip: 'bg-orange-100 text-orange-800', symbol: 'text-orange-700' };
const NEUTRAL_STYLE: OperationStyle = { border: 'border-gray-300', chip: 'bg-gray-100 text-gray-700', symbol: 'text-gray-600' };
// Cas retenu / non retenu (si, sinon, alors)
const GREEN_STYLE: OperationStyle = { border: 'border-green-400', chip: 'bg-green-200 text-green-800', symbol: 'text-green-700' };
const RED_STYLE: OperationStyle = { border: 'border-red-400', chip: 'bg-red-200 text-red-950', symbol: 'text-red-700' };

const SKY_STYLE: OperationStyle = { border: 'border-sky-200', chip: 'bg-sky-100 text-sky-800', symbol: 'text-sky-700' };

const OPERATION_STYLES: Record<string, OperationStyle> = {
  '-': BLUE_STYLE,
  '*': PURPLE_STYLE,
  '**': PURPLE_STYLE,
  '/': PURPLE_STYLE,
  '//': PURPLE_STYLE,
  '+': BLUE_STYLE,
  et: SKY_STYLE,
  ou: SKY_STYLE,
};

type ExplanationNodeViewProps = {
  node: ExplanationNode;
  engine: FCUEngine;
};

/**
 * Recursive renderer of a normalized publicodes formula node: operations as labelled
 * blocks of operands, references as inline-expandable rows, conditions as vertical
 * blocks of terms. Expansion is lazy (the referenced rule is only explained on click).
 */
export function ExplanationNodeView({ node, engine }: ExplanationNodeViewProps) {
  switch (node.kind) {
    case 'constant':
      return <ValueChip value={node.value} unit={node.unit} />;

    case 'reference':
      return <ReferenceRow node={node} engine={engine} />;

    case 'operation': {
      // Comparaison : rendu compact sur une ligne avec le verdict, plutôt qu'un bloc
      if (COMPARISON_OPERATORS.includes(node.operator)) {
        const [left, right] = node.operands;
        return (
          <div className="flex items-center gap-2">
            <div className="grow">
              <ExplanationNodeView node={left} engine={engine} />
            </div>
            <span className="shrink-0 text-sm italic text-gray-500">{node.operator}</span>
            <div className="shrink-0">
              <ExplanationNodeView node={right} engine={engine} />
            </div>
            <OutcomeArrow value={node.value} />
          </div>
        );
      }
      const style = OPERATION_STYLES[node.operator] ?? NEUTRAL_STYLE;
      return (
        <div className="flex flex-col gap-1">
          <span className={cx('self-start rounded px-1.5 py-0.5 text-xs font-medium', style.chip)}>
            {OPERATION_LABELS[node.operator] ?? node.operator}
          </span>
          <div className={cx('ml-1 flex flex-col gap-1.5 border-l-2 pl-3', style.border)}>
            {node.operands.map((operand, operandIndex) => (
              <div key={operandIndex} className="flex items-start gap-2">
                <span
                  className={cx(
                    'w-4 shrink-0 pt-1 text-center text-sm font-bold',
                    style.symbol,
                    operandIndex === 0 && 'invisible',
                    (node.operator === 'et' || node.operator === 'ou') && 'w-5 italic'
                  )}
                >
                  {OPERATOR_SYMBOLS[node.operator] ?? node.operator}
                </span>
                <div className="grow">
                  <ExplanationNodeView node={operand} engine={engine} />
                </div>
              </div>
            ))}
            {typeof node.value === 'boolean' ? (
              <div className="flex items-center gap-2 text-sm">
                <span className={cx('w-4 shrink-0 text-center font-bold', style.symbol)}>⇒</span>
                <span className={cx('font-bold', node.value ? 'text-green-700' : 'text-red-700')}>{node.value ? 'oui' : 'non'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className={cx('w-4 shrink-0 text-center font-bold', style.symbol)}>=</span>
                <ValueChip value={node.value} unit={node.unit} emphasis />
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'test':
      return (
        <div className="flex items-center gap-2">
          <div className="grow">
            <ExplanationNodeView node={node.operand} engine={engine} />
          </div>
          <span className="shrink-0 text-sm italic text-gray-500">{node.keyword}</span>
          <OutcomeArrow value={node.value} />
        </div>
      );

    case 'condition': {
      const verdictStyle = node.isConditionTrue ? GREEN_STYLE : RED_STYLE;
      return (
        <div className="flex flex-col gap-1">
          <span className={cx('self-start rounded px-1.5 py-0.5 text-xs font-medium', verdictStyle.chip)}>si</span>
          <div className="ml-1 pl-3">
            <ExplanationNodeView node={node.condition} engine={engine} />
          </div>
          <span className={cx('self-start rounded px-1.5 py-0.5 text-xs font-medium', verdictStyle.chip)}>
            {node.isConditionTrue ? 'alors' : 'sinon'}
          </span>
          <div className={cx('ml-1 border-l-2 pl-3', verdictStyle.border)}>
            <ExplanationNodeView node={node.result} engine={engine} />
          </div>
        </div>
      );
    }

    case 'variations':
      return (
        <div className="flex flex-col gap-1">
          <span className={cx('self-start rounded px-1.5 py-0.5 text-xs font-medium', ORANGE_STYLE.chip)}>variations</span>
          <div className={cx('ml-1 flex flex-col gap-2 border-l-2 pl-3', ORANGE_STYLE.border)}>
            {node.cases.map((variationCase, caseIndex) => (
              <VariationCaseView key={caseIndex} variationCase={variationCase} engine={engine} />
            ))}
          </div>
        </div>
      );

    case 'mecanism':
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <span className={cx('rounded px-1.5 py-0.5 text-xs font-medium', NEUTRAL_STYLE.chip)}>{node.name}</span>
            <ValueChip value={node.value} unit={node.unit} />
          </div>
          {node.children.length > 0 && (
            <div className={cx('ml-1 flex flex-col gap-1 border-l-2 pl-3', NEUTRAL_STYLE.border)}>
              {node.children.map((child, childIndex) => (
                <ExplanationNodeView key={childIndex} node={child} engine={engine} />
              ))}
            </div>
          )}
        </div>
      );
  }
}

type ReferenceRowProps = {
  node: Extract<ExplanationNode, { kind: 'reference' }>;
  engine: FCUEngine;
};

/** A referenced rule: label + value, expandable inline to reveal its formula (or the model value a user input overrides) */
function ReferenceRow({ node, engine }: ReferenceRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigateToRule = useContext(ExplanationNavigationContext);
  const canExpand = node.hasFormula || node.hasOverriddenValue;
  const expandedExplanation = isExpanded ? buildRuleExplanation(engine, node.dottedName) : null;

  return (
    <div className="flex flex-col">
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          disabled={!canExpand}
          onClick={() => setIsExpanded(!isExpanded)}
          title={node.dottedName}
          className={cx(
            'flex grow items-center gap-2 border border-gray-200 bg-white px-2 py-1 text-left text-sm',
            canExpand && 'cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50'
          )}
        >
          {canExpand && <Icon name="fr-icon-arrow-right-s-line" size="sm" rotate={isExpanded ? 90 : 0} className="text-blue-600" />}
          <span className="grow whitespace-nowrap">{node.label}</span>
          <ProvenanceTag provenance={node.provenance} />
          <ValueChip value={node.value} unit={node.unit} />
        </button>
        {navigateToRule && (
          <button
            type="button"
            onClick={() => navigateToRule(node.dottedName)}
            title={`Ouvrir « ${node.dottedName} »`}
            className="flex shrink-0 cursor-pointer items-center border border-gray-200 bg-white px-1.5 text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
          >
            <Icon name="fr-icon-arrow-right-line" size="sm" />
          </button>
        )}
      </div>
      {isExpanded && expandedExplanation && (
        <div className="ml-6 mt-1.5 pb-1">
          {expandedExplanation.formula ? (
            <ExplanationNodeView node={expandedExplanation.formula} engine={engine} />
          ) : (
            <p className="mb-0 text-sm text-gray-600">
              {expandedExplanation.overriddenModelValue !== undefined ? (
                <>
                  Valeur saisie — remplace la valeur du modèle :{' '}
                  <ValueChip value={expandedExplanation.overriddenModelValue} unit={expandedExplanation.unit} />
                </>
              ) : (
                'Constante du modèle.'
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type VariationCaseViewProps = {
  variationCase: ExplanationVariationCase;
  engine: FCUEngine;
};

/** One variation case: si/sinon + oui/non; condition and formula of inactive cases are collapsed by default, struck when shown */
function VariationCaseView({ variationCase, engine }: VariationCaseViewProps) {
  const [isExpanded, setIsExpanded] = useState(variationCase.isActive);
  const caseStyle = variationCase.isActive ? GREEN_STYLE : RED_STYLE;

  return (
    <div className={cx('flex flex-col gap-1', !variationCase.isActive && 'opacity-60')}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Replier ce cas' : 'Déplier ce cas'}
        className="flex cursor-pointer items-center gap-2 border border-gray-200 bg-white px-2 py-1 text-left text-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
      >
        <Icon name="fr-icon-arrow-right-s-line" size="sm" rotate={isExpanded ? 90 : 0} className="shrink-0 text-blue-600" />
        <span className={cx('shrink-0 rounded px-1.5 py-0.5 text-xs font-medium', caseStyle.chip)}>
          {variationCase.condition === null ? 'sinon' : 'si'}
        </span>
        {!isExpanded && variationCase.condition !== null && (
          <>
            <span className="min-w-0 grow truncate">
              <SummaryInline node={variationCase.condition} />
            </span>
            <OutcomeArrow value={variationCase.isActive} />
          </>
        )}
      </button>
      {isExpanded && (
        <div className="flex flex-col gap-1 pl-8">
          {variationCase.condition !== null && (
            <>
              <div className="ml-1 pl-3">
                <ExplanationNodeView node={variationCase.condition} engine={engine} />
              </div>
              <span className={cx('self-start rounded px-1.5 py-0.5 text-xs font-medium', caseStyle.chip)}>alors</span>
            </>
          )}
          <div className={cx('ml-1 border-l-2 pl-3', caseStyle.border, !variationCase.isActive && 'line-through decoration-gray-400')}>
            <ExplanationNodeView node={variationCase.result} engine={engine} />
          </div>
        </div>
      )}
    </div>
  );
}

type SummaryInlineProps = {
  node: ExplanationNode;
};

/** Compact inline summary of a condition for collapsed case headers: rule names as chips, keywords in italic */
function SummaryInline({ node }: SummaryInlineProps) {
  const keyword = (text: string) => <span className="italic text-gray-500">{text}</span>;
  switch (node.kind) {
    case 'reference':
      return <span className="rounded bg-blue-50 px-1 py-0.5 font-medium text-blue-900">{node.label}</span>;
    case 'constant':
      return <span className="font-medium text-gray-900">{formatNodeValue(node.value)}</span>;
    case 'operation':
      return (
        <>
          {node.operands.map((operand, operandIndex) => (
            <Fragment key={operandIndex}>
              {operandIndex > 0 && <> {keyword(node.operator)} </>}
              <SummaryInline node={operand} />
            </Fragment>
          ))}
        </>
      );
    case 'test':
      return (
        <>
          <SummaryInline node={node.operand} /> {keyword(node.keyword)}
        </>
      );
    case 'condition':
      return (
        <>
          {keyword('si')} <SummaryInline node={node.condition} />
        </>
      );
    case 'variations':
      return keyword('variations');
    case 'mecanism':
      return keyword(node.name);
  }
}

type OutcomeArrowProps = {
  value: ExplanationNode['value'];
};

/** "⇒ oui/non" verdict suffix for a boolean result (comparison, test, collapsed case) */
function OutcomeArrow({ value }: OutcomeArrowProps) {
  if (typeof value !== 'boolean') {
    return null;
  }
  return (
    <span className={cx('shrink-0 whitespace-nowrap text-sm font-medium', value ? 'text-green-700' : 'text-red-700')}>
      ⇒ {value ? 'oui' : 'non'}
    </span>
  );
}

type ValueChipProps = {
  value: ExplanationNode['value'];
  unit: string;
  emphasis?: boolean;
};

function ValueChip({ value, unit, emphasis }: ValueChipProps) {
  return (
    <span
      className={cx(
        'shrink-0 whitespace-nowrap tabular-nums',
        emphasis ? 'font-bold' : 'font-medium',
        typeof value === 'boolean' && (value ? 'text-green-700' : 'text-red-700')
      )}
    >
      {formatNodeValue(value)}
      {unit && <span className="ml-1 text-xs font-normal text-gray-500">{unit}</span>}
    </span>
  );
}

const provenanceStyles = {
  computed: null,
  default: { className: 'bg-gray-100 text-gray-600', label: 'défaut' },
  situation: { className: 'bg-blue-100 text-blue-800', label: 'saisie' },
} as const;

type ProvenanceTagProps = {
  provenance: keyof typeof provenanceStyles;
};

function ProvenanceTag({ provenance }: ProvenanceTagProps) {
  const style = provenanceStyles[provenance];
  return style ? <span className={cx('shrink-0 rounded px-1.5 py-0.5 text-xs', style.className)}>{style.label}</span> : null;
}
