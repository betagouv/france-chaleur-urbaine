import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { useDebouncedEffect } from '@react-hookz/web';
import { useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import { getRuleLabel } from '@/components/form/publicodes/labels';
import Icon from '@/components/ui/Icon';
import { RuleNote } from '@/modules/publicodes/client/RuleNote';
import { type FCUEngine, getRuleAnnotation, getRuleProvenance } from '@/modules/publicodes/explanation-model';
import { formatNodeValue, formatUnit } from '@/modules/publicodes/format';
import cx from '@/utils/cx';
import { slugify, upperCaseFirstChar } from '@/utils/strings';

import { addresseToPublicodesRules } from '../mappings';

type ScenarioParamFieldProps = {
  rule: RuleName;
  /** Engine of the shared context (no scenario override): gives the value the override replaces and its provenance */
  baseEngine: FCUEngine;
  value: string | number | null | undefined;
  onChange: (value: string | number | null) => void;
  onExplain: (rule: RuleName) => void;
};

export const getScenarioParamFieldId = (rule: RuleName) => `scenario-param-${slugify(rule)}`;

const provenanceLabels = {
  address: { className: 'bg-fcu-green/20 text-fcu-green', label: 'adresse' },
  computed: { className: 'bg-gray-100 text-gray-600', label: 'calculée' },
  default: { className: 'bg-gray-100 text-gray-600', label: 'défaut modèle' },
  situation: { className: 'bg-blue-100 text-blue-800', label: 'saisie' },
};

/**
 * One scenario parameter: shows the value it would have without override (with its provenance and the model note),
 * and lets the user type an override — number input, or select when the rule enumerates its possibilities.
 */
export function ScenarioParamField({ rule, baseEngine, value, onChange, onExplain }: ScenarioParamFieldProps) {
  const evaluated = baseEngine.evaluate(rule);
  const rawNode = baseEngine.getRule(rule).rawNode;
  const possibilities = rawNode['une possibilité'];
  const options = Array.isArray(possibilities) ? possibilities.map((option) => String(option).replace(/^'|'$/g, '')) : null;
  const isBoolean = typeof evaluated.nodeValue === 'boolean';
  const unit = evaluated.unit ? formatUnit(evaluated.unit) : '';
  const baseValue = formatNodeValue(evaluated.nodeValue);
  const provenance = rule in addresseToPublicodesRules ? 'address' : getRuleProvenance(baseEngine, rule);
  const isOverridden = value !== null && value !== undefined && value !== '';

  const label = (
    <span className="flex items-center gap-2">
      <span className={cx(isOverridden && 'font-bold')}>{upperCaseFirstChar(getRuleLabel(rule) ?? rule)}</span>
      {unit && <small className="text-faded">{unit}</small>}
      {isOverridden ? (
        <span className="rounded bg-blue-600 px-1 py-0.5 text-[10px] leading-none text-white" title="Surchargé dans ce scénario">
          modifié
        </span>
      ) : (
        <span
          className={cx('rounded px-1 py-0.5 text-[10px] leading-none', provenanceLabels[provenance].className)}
          title="Origine de la valeur de base"
        >
          {provenanceLabels[provenance].label}
        </span>
      )}
      <button
        type="button"
        onClick={() => onExplain(rule)}
        title={`Comprendre le calcul de « ${rule} »`}
        className="ml-auto cursor-pointer text-xs text-blue-600 underline hover:text-blue-800"
      >
        calcul
      </button>
    </span>
  );
  const annotation = getRuleAnnotation(baseEngine, rule);
  const hint = (
    <>
      Base : {baseValue}
      {(annotation.sources.length > 0 || annotation.remark) && (
        <>
          {' '}
          · <RuleNote annotation={annotation} withLabel fallback={null} />
        </>
      )}
    </>
  );

  return (
    <div
      id={getScenarioParamFieldId(rule)}
      className={cx('mb-3 rounded px-3 py-3 [&_.fr-select-group]:mb-0', isOverridden && 'bg-blue-50 ring-1 ring-blue-200')}
    >
      {options || isBoolean ? (
        <Select
          label={label}
          hint={hint}
          options={[
            { label: `Base (${baseValue})`, value: '' },
            ...(options ?? ['oui', 'non']).map((option) => ({ label: option, value: option })),
          ]}
          nativeSelectProps={{
            onChange: (event) => onChange(event.target.value === '' ? null : options ? `'${event.target.value}'` : event.target.value),
            value: typeof value === 'string' ? value.replace(/^'|'$/g, '') : '',
          }}
        />
      ) : (
        <DebouncedNumberInput label={label} hint={hint} placeholder={baseValue} value={value} onChange={onChange} />
      )}
    </div>
  );
}

type DebouncedNumberInputProps = {
  label: React.ReactNode;
  hint: React.ReactNode;
  placeholder: string;
  value: string | number | null | undefined;
  onChange: (value: number | null) => void;
};

/** Keeps keystrokes local and commits to the scenario after a pause, so each scenario engine is not re-evaluated on every key */
function DebouncedNumberInput({ label, hint, placeholder, value, onChange }: DebouncedNumberInputProps) {
  const [draft, setDraft] = useState(value === null || value === undefined ? '' : String(value));

  useDebouncedEffect(
    () => {
      const committed = draft === '' ? null : Number(draft);
      if (committed !== (value ?? null) && (committed === null || !Number.isNaN(committed))) {
        onChange(committed);
      }
    },
    [draft],
    400
  );

  const resetToBase = () => {
    setDraft('');
    onChange(null);
  };

  return (
    <div className="relative">
      <Input
        label={label}
        hintText={hint}
        hideOptionalLabel
        classes={{ root: 'mb-0' }}
        nativeInputProps={{
          className: draft === '' ? undefined : 'pr-18',
          onChange: (event) => setDraft(event.target.value),
          placeholder,
          type: 'number',
          value: draft,
        }}
      />
      {draft !== '' && (
        <button
          type="button"
          onClick={resetToBase}
          title={`Revenir à la valeur de base (${placeholder})`}
          aria-label={`Revenir à la valeur de base (${placeholder})`}
          className="absolute right-10 bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-gray-500 hover:bg-gray-200 hover:text-blue-700"
        >
          <Icon name="fr-icon-close-line" size="sm" />
        </button>
      )}
    </div>
  );
}
