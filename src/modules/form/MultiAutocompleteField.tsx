import { type ReactNode, useId } from 'react';

import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import Button from '@/components/ui/Button';

import { highlightMatch } from './AddressSearch';
import { Autocomplete } from './Autocomplete';

export type MultiAutocompleteFieldProps = {
  label?: ReactNode;
  hintText?: ReactNode;
  state?: 'success' | 'error' | 'default' | 'info';
  stateRelatedMessage?: ReactNode;
  className?: string;
  placeholder?: string;
  /** Selected values (controlled). */
  values: string[];
  onChange: (values: string[]) => void;
  /** Async suggestions source matched against the query. Omit for a pure free-text tags field. */
  fetchFn?: (query: string, signal: AbortSignal) => Promise<string[]>;
  minCharThreshold?: number;
  /** Enter adds the typed text as a tag when no suggestion is highlighted (default true). */
  allowFreeText?: boolean;
  /** Clickable quick-pick suggestions rendered below the field. */
  suggestions?: { label: ReactNode; value: string }[];
};

/**
 * DSFR-wrapped multi-value autocomplete: inline tags + async suggestions (when `fetchFn` is
 * provided) + free text on Enter, with optional clickable quick-picks. Thin wrapper composing
 * `FieldWrapper` (label/hint/error) and `Autocomplete` in `multiple` mode over `string` values.
 */
export function MultiAutocompleteField({
  label,
  hintText,
  state,
  stateRelatedMessage,
  className,
  placeholder,
  values,
  onChange,
  fetchFn,
  minCharThreshold = 2,
  allowFreeText = true,
  suggestions,
}: MultiAutocompleteFieldProps) {
  const id = useId();
  const addValue = (value: string) => {
    if (!values.includes(value)) {
      onChange([...values, value]);
    }
  };
  return (
    <FieldWrapper
      fieldId={id}
      label={label}
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      className={className}
    >
      <Autocomplete<string>
        id={id}
        multiple
        allowFreeText={allowFreeText}
        values={values}
        onValuesChange={onChange}
        fetchFn={fetchFn}
        getOptionValue={(value) => value}
        getOptionLabel={(value, query) => highlightMatch(value, query)}
        minCharThreshold={minCharThreshold}
        nativeInputProps={{ placeholder }}
      />
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {suggestions.map((suggestion) => (
            <Button key={suggestion.value} type="button" size="small" priority="tertiary" onClick={() => addValue(suggestion.value)}>
              {suggestion.label}
            </Button>
          ))}
        </div>
      )}
    </FieldWrapper>
  );
}
