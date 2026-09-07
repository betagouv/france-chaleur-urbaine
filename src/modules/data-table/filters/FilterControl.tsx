import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { type ReactNode, useId } from 'react';

import Checkboxes from '@/components/form/dsfr/Checkboxes';
import Input from '@/components/form/dsfr/Input';
import RangeFilter from '@/components/form/dsfr/RangeFilter';
import ComboBox from '@/components/ui/ComboBox';

import { type DateRangeFilterValue, EMPTY_FACET_KEY, type FacetOption, type FilterDef } from './filter-types';

type FilterControlProps<Row> = {
  filter: FilterDef<Row>;
  value: unknown;
  onChange: (value: unknown) => void;
  facetOptions: FacetOption[] | undefined;
  rangeDomain: [number, number] | undefined;
};

const COMBOBOX_THRESHOLD = 12;

const formatFacetKey = (key: string, formatOption: ((key: string) => ReactNode) | undefined): ReactNode => {
  if (key === EMPTY_FACET_KEY) {
    return 'Aucun';
  }
  if (key === 'true' || key === 'false') {
    return (
      <Badge noIcon severity={key === 'true' ? 'success' : 'error'} small>
        {key === 'true' ? 'Oui' : 'Non'}
      </Badge>
    );
  }
  return formatOption ? formatOption(key) : key;
};

/**
 * Input of one filter according to its type; emits `undefined` when the filter is back to neutral.
 */
export function FilterControl<Row>({ filter, value, onChange, facetOptions, rangeDomain }: FilterControlProps<Row>) {
  const inputId = useId();

  switch (filter.type) {
    case 'facets': {
      const options = facetOptions ?? [];
      const selected = (value as string[] | undefined) ?? [];
      const display = filter.display ?? (options.length > COMBOBOX_THRESHOLD ? 'combobox' : 'checkboxes');
      const emit = (keys: string[]) => onChange(keys.length === 0 ? undefined : keys);
      if (display === 'combobox') {
        return (
          <ComboBox
            multiple
            options={options.map((option) => {
              const label = formatFacetKey(option.key, filter.formatOption);
              return { key: option.key, label: `${typeof label === 'string' ? label : option.key} (${option.count})` };
            })}
            value={selected}
            onChange={emit}
            placeholder="Sélectionner…"
          />
        );
      }
      return (
        <Checkboxes
          small
          className="mb-0!"
          options={options.map((option) => ({
            label: (
              <span className="flex items-center gap-1">
                {formatFacetKey(option.key, filter.formatOption)} ({option.count})
              </span>
            ),
            nativeInputProps: {
              checked: selected.includes(option.key),
              onChange: () =>
                emit(selected.includes(option.key) ? selected.filter((key) => key !== option.key) : [...selected, option.key]),
              value: option.key,
            },
          }))}
        />
      );
    }
    case 'range': {
      if (!rangeDomain) {
        return <span className="text-sm text-gray-600">Aucune valeur à filtrer</span>;
      }
      return (
        <RangeFilter
          small
          domain={rangeDomain}
          value={value as [number, number] | undefined}
          unit={filter.unit}
          formatNumber={filter.formatNumber}
          onChange={(range) => onChange(range[0] === rangeDomain[0] && range[1] === rangeDomain[1] ? undefined : range)}
        />
      );
    }
    case 'dateRange': {
      const range = (value as DateRangeFilterValue | undefined) ?? {};
      const emit = (next: DateRangeFilterValue) => onChange(!next.from && !next.to && !next.includeEmpty ? undefined : next);
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-4">
            <Input
              label="Du"
              hideOptionalLabel
              nativeInputProps={{
                onChange: (event) => emit({ ...range, from: event.target.value || undefined }),
                type: 'date',
                value: range.from ?? '',
              }}
            />
            <Input
              label="Au"
              hideOptionalLabel
              nativeInputProps={{
                onChange: (event) => emit({ ...range, to: event.target.value || undefined }),
                type: 'date',
                value: range.to ?? '',
              }}
            />
          </div>
          <div className="fr-checkbox-group fr-checkbox-group--sm">
            <input
              type="checkbox"
              id={`${inputId}-empty`}
              checked={range.includeEmpty ?? false}
              onChange={(event) => emit({ ...range, includeEmpty: event.target.checked || undefined })}
            />
            <label className="fr-label" htmlFor={`${inputId}-empty`}>
              Inclure les valeurs vides
            </label>
          </div>
        </div>
      );
    }
    case 'text':
      return (
        <Input
          label=""
          nativeInputProps={{
            onChange: (event) => onChange(event.target.value || undefined),
            placeholder: filter.placeholder ?? 'Filtrer…',
            value: (value as string | undefined) ?? '',
          }}
        />
      );
    case 'emptyOrFilled': {
      const options = [
        { key: 'filled', label: filter.filledLabel ?? 'Rempli' },
        { key: 'empty', label: filter.emptyLabel ?? 'Vide' },
      ] as const;
      return (
        <div className="flex gap-4">
          {options.map((option) => (
            <div key={option.key} className="fr-checkbox-group fr-checkbox-group--sm">
              <input
                type="checkbox"
                id={`${inputId}-${option.key}`}
                checked={value === option.key}
                onChange={(event) => onChange(event.target.checked ? option.key : undefined)}
              />
              <label className="fr-label" htmlFor={`${inputId}-${option.key}`}>
                {option.label}
              </label>
            </div>
          ))}
        </div>
      );
    }
    case 'custom':
      return filter.render({ onChange, value });
  }
}
