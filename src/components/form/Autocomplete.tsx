import React, { useEffect, useId, useMemo, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import { Combobox, ComboboxInput, ComboboxList, ComboboxOption, ComboboxOptionText, ComboboxPopover } from '@components/ui/Combobox';
import Icon from '@components/ui/Icon';
import debounce from '@utils/debounce';

type DefaultOption = Record<string, any>;

export type AutocompleteProps<Option extends DefaultOption> = Omit<React.ComponentProps<typeof Combobox>, 'children' | 'onSelect'> & {
  fetchFn: (query: string) => Promise<Option[]>;
  debounceTime?: number;
  minCharThreshold?: number;
  onSelect: (option: Option) => void;
  onClear?: () => void;
  nativeInputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>;
  getOptionLabel?: (data: { option: Option; result: React.ReactNode }) => React.ReactNode;
  getOptionValue: (option: Option) => string;
};

const Autocomplete = <Option extends DefaultOption>({
  fetchFn,
  nativeInputProps,
  debounceTime = 300,
  minCharThreshold = 0,
  getOptionLabel,
  getOptionValue,
  onSelect,
  onClear,
  ...props
}: AutocompleteProps<Option>) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
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
    if (inputValue?.length >= minCharThreshold && !selectedValue) {
      debouncedFetch(inputValue);
    }
  }, [inputValue, debouncedFetch, selectedValue]);

  return (
    <Combobox {...props}>
      <div style={{ position: 'relative' }}>
        <ComboboxInput
          id={generatedId}
          value={selectedValue || inputValue}
          onChange={(event) => {
            setSelectedValue('');
            setInputValue(event.target.value);
          }}
          {...nativeInputProps}
          style={{
            ...nativeInputProps?.style,
            textOverflow: 'ellipsis',
            paddingRight: '2.5rem',
          }}
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
            setSelectedValue('');
            inputValue ? setInputValue('') : undefined;
            setOptions([]);
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
                    setSelectedValue(optionValue);
                    setOptions([]);
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
  );
};

export default Autocomplete;
