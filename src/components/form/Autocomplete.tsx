import { fr } from '@codegouvfr/react-dsfr';
import React, { useEffect, useId, useMemo, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import { Combobox, ComboboxInput, ComboboxList, ComboboxOption, ComboboxOptionText, ComboboxPopover } from '@components/ui/Combobox';
import Icon from '@components/ui/Icon';
import debounce from '@utils/debounce';

import FieldWrapper, { type FieldWrapperProps } from './dsfr/FieldWrapper';
import { type InputProps } from './dsfr/Input';

type DefaultOption = Record<string, any>;

type AutocompleteProps<Option extends DefaultOption> = Omit<FieldWrapperProps, 'onSelect'> & {
  fetchFn: (query: string) => Promise<Option[]>;
  debounceTime?: number;
  onSelect: (option: Option) => void;
  onClear?: () => void;
  nativeInputProps?: Omit<InputProps['nativeInputProps'], 'onChange' | 'value'>;
  getOptionLabel?: (data: { option: Option; result: React.ReactNode }) => React.ReactNode;
  getOptionValue: (option: Option) => string;
};

const Autocomplete = <Option extends DefaultOption>({
  fetchFn,
  label,
  hintText,
  state,
  nativeInputProps,
  disabled,
  stateRelatedMessage,
  debounceTime = 300,
  getOptionLabel,
  getOptionValue,
  onSelect,
  onClear,
  ...props
}: AutocompleteProps<Option>) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const generatedId = useId();

  const debouncedFetch = useMemo(
    () =>
      debounce(async (query: string) => {
        setLoading(true);
        try {
          const results = await fetchFn(query);
          setOptions(results);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }, debounceTime),
    [fetchFn]
  );

  useEffect(() => {
    if (inputValue) {
      debouncedFetch(inputValue);
    } else {
      setOptions([]);
    }
  }, [inputValue, debouncedFetch]);

  return (
    <FieldWrapper
      fieldId={generatedId}
      label={label}
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      {...props}
    >
      <Combobox>
        <div className={fr.cx('fr-input-wrap')}>
          <ComboboxInput
            id={generatedId}
            className={fr.cx('fr-input', {
              'fr-input--error': state === 'error',
              'fr-input--valid': state === 'success',
            })}
            style={{
              // this is because DSFR uses .fr-label + .fr-input, .fr-label + .fr-input-wrap, .fr-label + .fr-select which can't be used here
              marginTop: label ? '0.5rem' : 'inherit',
            }}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            {...nativeInputProps}
          />
          {loading && (
            <Oval
              height={16}
              width={16}
              color="var(--text-default-grey)"
              secondaryColor="var(--text-default-grey)"
              wrapperStyle={{
                position: 'absolute',
                color: 'var(--text-default-grey)',
                top: '0.75rem',
                bottom: '0.75rem',
                margin: 'auto',
                right: 'calc(16px + 1.5rem)',
              }}
            />
          )}
          <Icon
            size="sm"
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '1rem',
              bottom: '0.75rem',
              margin: 'auto',
              pointerEvents: inputValue ? 'all' : 'none',
              cursor: inputValue ? 'pointer' : 'default',
            }}
            name={inputValue ? 'fr-icon-close-line' : 'fr-icon-search-line'}
            onClick={() => {
              inputValue ? setInputValue('') : undefined;
              onClear?.();
            }}
          />
        </div>
        {options.length > 0 && (
          <ComboboxPopover>
            <ComboboxList>
              {options.map((option, index) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel ? getOptionLabel({ option, result: <ComboboxOptionText /> }) : <ComboboxOptionText />;
                return (
                  <ComboboxOption
                    key={`${optionValue}_${index}`}
                    value={optionValue}
                    onClick={() => {
                      setInputValue(optionValue);
                      onSelect?.(option);
                    }}
                  >
                    {optionLabel}
                  </ComboboxOption>
                );
              })}
            </ComboboxList>
          </ComboboxPopover>
        )}
      </Combobox>
    </FieldWrapper>
  );
};

export default Autocomplete;
