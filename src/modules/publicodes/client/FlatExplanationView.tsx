import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useContext, useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import cx from '@/utils/cx';

import {
  buildCalculationChain,
  type CalculationStep,
  collectContributingInputs,
  type FCUEngine,
  type FlatInput,
  type FlatToken,
  getRuleAnnotation,
  type RuleAnnotation,
} from '../explanation-model';
import { formatNodeValue } from '../format';
import { ExplanationNavigationContext } from './explanation-navigation';
import { RuleNote } from './RuleNote';

type FlatExplanationViewProps = {
  engine: FCUEngine;
  dottedName: RuleName;
};

const STEPS_PAGE_SIZE = 20;

const PROVENANCE_BADGES = {
  computed: { className: 'bg-gray-100 text-gray-600', label: 'constante' },
  default: { className: 'bg-gray-100 text-gray-600', label: 'défaut' },
  situation: { className: 'bg-blue-100 text-blue-800', label: 'saisie' },
};

/**
 * The calculation as a chain: one line per rule (the rule itself first, then every intermediate rule it relies on),
 * each line a flat one-level formula with its result, like a design office calculation note. Followed by the list of
 * every input that fed the value, with its provenance.
 */
export function FlatExplanationView({ engine, dottedName }: FlatExplanationViewProps) {
  const [hideZeroTerms, setHideZeroTerms] = useState(true);
  const [visibleSteps, setVisibleSteps] = useState(STEPS_PAGE_SIZE);
  const steps = useMemo(() => buildCalculationChain(engine, dottedName, { hideZeroTerms }), [engine, dottedName, hideZeroTerms]);
  const inputs = useMemo(
    () =>
      collectContributingInputs(engine, dottedName).map((input) => ({ annotation: getRuleAnnotation(engine, input.dottedName), input })),
    [engine, dottedName]
  );
  const rootNamespace = dottedName.split(' . ')[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-gray-500">
          {steps.length} étape{steps.length > 1 ? 's' : ''} de calcul, de la règle vers ses composantes
        </span>
        <ToggleSwitch
          label="Masquer les termes nuls"
          checked={hideZeroTerms}
          onChange={setHideZeroTerms}
          showCheckedHint={false}
          labelPosition="left"
          classes={{ label: 'text-xs!', root: 'mb-0!' }}
        />
      </div>
      <ol className="m-0 flex list-none flex-col gap-1 p-0">
        {steps.slice(0, visibleSteps).map((step, stepIndex) => (
          <CalculationStepRow
            key={step.dottedName}
            step={step}
            annotation={getRuleAnnotation(engine, step.dottedName)}
            rootNamespace={rootNamespace}
            isRoot={stepIndex === 0}
          />
        ))}
      </ol>
      {steps.length > visibleSteps && (
        <Button
          priority="tertiary"
          size="small"
          className="self-center"
          onClick={() => setVisibleSteps((current) => current + STEPS_PAGE_SIZE)}
        >
          Voir {Math.min(STEPS_PAGE_SIZE, steps.length - visibleSteps)} étapes de plus ({steps.length - visibleSteps} restantes)
        </Button>
      )}
      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Entrées du calcul ({inputs.length}) : saisies, valeurs par défaut et constantes réellement utilisées
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-1 pr-2 font-medium">Règle</th>
              <th className="py-1 pr-2 text-right font-medium">Valeur</th>
              <th className="py-1 pr-2 font-medium">Origine</th>
              <th className="py-1 font-medium">Source ou note</th>
            </tr>
          </thead>
          <tbody>
            {inputs.map(({ input, annotation }) => (
              <FlatInputRow key={input.dottedName} input={input} annotation={annotation} rootNamespace={rootNamespace} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Rule names inside the explained rule's namespace lose that prefix: « bilan . P1conso » instead of « gaz coll avec cond . bilan . P1conso » */
const shortenDottedName = (dottedName: string, rootNamespace: string) =>
  dottedName.startsWith(`${rootNamespace} . `) ? dottedName.slice(rootNamespace.length + 3) : dottedName;

/**
 * A bracket never parts from its content: « ( » joins the next token and « ) » the previous one in a single unbreakable
 * flex item. A non-breaking space cannot do it: the terms are buttons (atomic inlines), which browsers may wrap around.
 */
const groupTokens = (tokens: FlatToken[]): FlatToken[][] =>
  tokens.reduce<FlatToken[][]>((groups, token, tokenIndex) => {
    const gluedToPrevious = tokenIndex > 0 && (token.kind === 'close' || tokens[tokenIndex - 1].kind === 'open');
    if (gluedToPrevious) {
      groups[groups.length - 1].push(token);
    } else {
      groups.push([token]);
    }
    return groups;
  }, []);

type CalculationStepRowProps = { step: CalculationStep; annotation: RuleAnnotation; rootNamespace: string; isRoot: boolean };

function CalculationStepRow({ step, annotation, rootNamespace, isRoot }: CalculationStepRowProps) {
  const navigate = useContext(ExplanationNavigationContext);
  // A rule that is only another rule's name (« bilan . P1abo = coûts . P1 abonnement ») brings no arithmetic: shown lighter
  const isAlias = step.tokens.length === 1 && step.tokens[0].kind === 'reference';
  return (
    <li
      className={cx(
        'grid grid-cols-1 gap-x-3 gap-y-1 rounded border px-3 md:grid-cols-[minmax(10rem,16rem)_1fr]',
        isRoot
          ? 'border-blue-300 bg-blue-50 py-2'
          : isAlias
            ? 'border-dashed border-gray-200 bg-gray-50 py-1 opacity-80'
            : 'border-gray-200 bg-white py-2'
      )}
    >
      <button
        type="button"
        onClick={() => navigate?.(step.dottedName)}
        title={step.dottedName}
        className={cx('cursor-pointer self-start text-left text-sm leading-6 hover:text-blue-700 hover:underline', isRoot && 'font-bold')}
      >
        {shortenDottedName(step.dottedName, rootNamespace)}
      </button>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-6">
        <span className="font-bold text-gray-500">=</span>
        {groupTokens(step.tokens).map((group, groupIndex) => (
          <span key={groupIndex} className="flex items-center gap-x-1.5">
            {group.map((token, tokenIndex) => (
              <FlatTokenView key={tokenIndex} token={token} />
            ))}
          </span>
        ))}
        <span className="font-bold text-gray-500">=</span>
        <span className={cx('tabular-nums', isRoot ? 'font-bold' : 'font-medium')}>
          {formatNodeValue(step.value)}
          {step.unit && <span className="ml-1 text-xs font-normal text-gray-500">{step.unit}</span>}
        </span>
        {(annotation.sources.length > 0 || annotation.remark) && (
          <span className="basis-full text-xs text-gray-500">
            <RuleNote annotation={annotation} withLabel fallback={null} />
          </span>
        )}
      </div>
    </li>
  );
}

type FlatTokenViewProps = { token: FlatToken };

function FlatTokenView({ token }: FlatTokenViewProps) {
  const navigate = useContext(ExplanationNavigationContext);
  switch (token.kind) {
    case 'symbol':
      return <span className="font-bold text-gray-500">{token.text}</span>;
    case 'open': {
      const { dottedName, label } = token;
      return (
        <span className="font-bold text-gray-500">
          {dottedName ? (
            <button
              type="button"
              onClick={() => navigate?.(dottedName)}
              className="mr-1 cursor-pointer text-xs font-normal italic underline hover:text-blue-700"
            >
              {label}
            </button>
          ) : (
            label && <span className="mr-1 text-xs font-normal italic">{label}</span>
          )}
          (
        </span>
      );
    }
    case 'close':
      return <span className="font-bold text-gray-500">)</span>;
    case 'constant':
      return (
        <span className="tabular-nums">
          {formatNodeValue(token.value)}
          {token.unit && <span className="ml-0.5 text-xs text-gray-500">{token.unit}</span>}
        </span>
      );
    case 'reference': {
      const isInput = token.provenance !== 'computed' || !token.hasFormula;
      return (
        <button
          type="button"
          onClick={() => navigate?.(token.dottedName)}
          title={`${token.dottedName}${isInput ? ' (entrée du calcul)' : ' (règle intermédiaire, détaillée plus bas)'}`}
          className={cx(
            'inline-flex cursor-pointer items-baseline gap-1 rounded border px-1.5 leading-6 hover:border-blue-400 hover:bg-blue-50',
            token.provenance === 'situation'
              ? 'border-blue-200 bg-blue-50'
              : isInput
                ? 'border-gray-200 bg-gray-50'
                : 'border-dashed border-gray-300 bg-white'
          )}
        >
          <span className="text-gray-700">{token.label}</span>
          <span className="font-bold tabular-nums">{formatNodeValue(token.value)}</span>
          {token.unit && <span className="text-xs text-gray-500">{token.unit}</span>}
        </button>
      );
    }
  }
}

type FlatInputRowProps = { input: FlatInput; annotation: RuleAnnotation; rootNamespace: string };

function FlatInputRow({ input, annotation, rootNamespace }: FlatInputRowProps) {
  const navigate = useContext(ExplanationNavigationContext);
  const badge = PROVENANCE_BADGES[input.provenance];
  return (
    <tr className="border-b border-gray-100">
      <td className="py-1 pr-2">
        <button
          type="button"
          onClick={() => navigate?.(input.dottedName)}
          title={input.dottedName}
          className="cursor-pointer text-left hover:text-blue-700 hover:underline"
        >
          {shortenDottedName(input.dottedName, rootNamespace)}
        </button>
      </td>
      <td className="whitespace-nowrap py-1 pr-2 text-right font-bold tabular-nums">
        {formatNodeValue(input.value)}
        {input.unit && <span className="ml-1 text-xs font-normal text-gray-500">{input.unit}</span>}
      </td>
      <td className="py-1 pr-2">
        <span className={cx('rounded px-1.5 py-0.5 text-[10px] leading-none', badge.className)}>{badge.label}</span>
      </td>
      <td className="max-w-72 truncate py-1">
        <RuleNote annotation={annotation} />
      </td>
    </tr>
  );
}
