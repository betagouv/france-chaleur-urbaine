import Tag from '@codegouvfr/react-dsfr/Tag';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Icon from '@/components/ui/Icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import Tooltip from '@/components/ui/Tooltip';
import { arrayEquals } from '@/utils/array';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { stopPropagation } from '@/utils/events';

export type ChipOption = {
  key: string;
  label: ReactNode;
  title?: string;
  className?: string;
  dismissible?: boolean;
};

type ChipAutoCompletePropsBase = {
  options: ChipOption[];
  defaultOption: ChipOption;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  classNames?: {
    wrapper?: string;
    input?: string;
  };
};

/**
 * Discriminated union: 4 variants based on `multiple` and `suggestedValue` presence.
 * - With suggestedValue: null allowed (to clear suggestions)
 * - Without suggestedValue: null disallowed (no suggestions to clear)
 */
export type ChipAutoCompleteProps =
  | (ChipAutoCompletePropsBase & {
      multiple: true;
      suggestedValue: string[];
      value: string[] | null;
      onChange: (value: string[] | null) => void;
    })
  | (ChipAutoCompletePropsBase & {
      multiple: true;
      suggestedValue?: undefined;
      value: string[];
      onChange: (value: string[]) => void;
    })
  | (ChipAutoCompletePropsBase & {
      multiple?: false;
      suggestedValue: string;
      value: string | null;
      onChange: (value: string | null) => void;
    })
  | (ChipAutoCompletePropsBase & {
      multiple?: false;
      suggestedValue?: undefined;
      value: string;
      onChange: (value: string) => void;
    });

const ChipAutoComplete = (rawProps: ChipAutoCompleteProps) => {
  // keep props to allow type inference with multiple
  const props = { multiple: false, ...rawProps } satisfies ChipAutoCompleteProps;
  const { options, defaultOption, value: valueExternal, label, placeholder = 'Ajouter…', disabled = false, className, classNames } = props;
  const valueExternalArray = Array.isArray(valueExternal) ? valueExternal : [valueExternal];
  const [valueArray, setValueArray] = useState(
    valueExternal === null && isDefined(props.suggestedValue)
      ? props.multiple
        ? props.suggestedValue
        : [props.suggestedValue]
      : valueExternalArray
  );
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Update the valueArray when the valueExternalArray changes
    if (!arrayEquals(valueExternalArray, valueArray)) {
      setValueArray(
        valueExternal === null && isDefined(props.suggestedValue)
          ? props.multiple
            ? props.suggestedValue
            : [props.suggestedValue]
          : valueExternalArray
      );
    }
  }, [JSON.stringify(valueExternalArray)]);

  const filteredOptions = useMemo(() => {
    const searchValue = inputValue.toLowerCase();
    return searchValue === '' ? options : options.filter((option) => option.key.toLowerCase().includes(searchValue));
  }, [inputValue, options]);

  useEffect(() => {
    if (isOpen && filteredOptions.length > 0) setHighlightedIndex(0);
  }, [isOpen, inputValue, filteredOptions.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (filteredOptions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleOptionSelect = (option: ChipOption) => {
    setTimeout(() => inputRef.current?.focus(), 0);
    setInputValue('');
    setIsOpen(false);

    if (props.multiple) {
      setValueArray([...(valueArray || []), option.key]);
      props.onChange([...((valueArray as string[]) || []), option.key]);
    } else {
      setValueArray([option.key]);
      props.onChange(option.key);
    }
  };

  const handleChipRemove = (chipName: string) => {
    if (props.multiple) {
      const newValue = valueArray.filter((v) => v !== chipName);
      setValueArray(newValue);
      props.onChange(newValue as string[]);
    } else {
      setValueArray([]);
      props.onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === 'Enter' && isOpen && filteredOptions[highlightedIndex]) {
      e.preventDefault();
      handleOptionSelect(filteredOptions[highlightedIndex]);
    } else if (e.key === 'Backspace' && inputValue === '' && valueArray.length > 0) {
      handleChipRemove((valueArray as string[])[valueArray.length - 1]);
    }
  };

  const resetValue = useCallback(() => {
    setInputValue('');
    if (props.multiple) {
      setValueArray(props.suggestedValue ?? []);
      (props.onChange as (value: string[] | null) => void)(props.suggestedValue ?? []);
    } else {
      setValueArray(props.suggestedValue ? [props.suggestedValue] : []);
      (props.onChange as (value: string | null) => void)(null);
    }
  }, [props.suggestedValue, props.onChange]);

  const inputElement = (
    <div className={cx('w-full', className)} onClick={stopPropagation} onDoubleClick={stopPropagation}>
      {label && <label className="block mb-1 text-sm font-medium">{label}</label>}
      <Popover
        open={isOpen && inputValue !== '' && filteredOptions.length > 0}
        onOpenChange={(open) => {
          setIsOpen(open);
        }}
      >
        <PopoverTrigger asChild>
          <div
            className={cx(
              'flex flex-wrap items-center gap-1 focus-within:ring-2 ring-blue-00 cursor-text',
              disabled && 'opacity-60 pointer-events-none',
              classNames?.wrapper || 'border rounded-sm pl-2 pr-4 py-1 min-h-10 bg-white'
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {valueArray.map((tagName) => {
              const chipOption = options.find((option) => option.key === tagName) ?? defaultOption;
              return (
                <Tag
                  key={tagName}
                  dismissible={chipOption.dismissible !== false}
                  small
                  className={chipOption?.className}
                  nativeButtonProps={{
                    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handleChipRemove(tagName as string);
                    },
                    title: chipOption?.title,
                  }}
                >
                  {chipOption.label || tagName}
                </Tag>
              );
            })}
            <input
              ref={inputRef}
              type="text"
              className={cx('flex-1 w-full outline-hidden! border-none bg-transparent text-sm min-w-[6ch]', classNames?.input || ' py-1')}
              value={inputValue}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onChange={(e) => {
                e.stopPropagation();
                handleInputChange(e);
              }}
              onFocus={(e) => {
                e.stopPropagation();
                handleInputFocus();
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                handleKeyDown(e);
              }}
              placeholder={placeholder}
              disabled={disabled}
              aria-label={label || 'Ajouter'}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          sideOffset={4}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          {isOpen && (
            <ul className="max-h-48 overflow-auto p-0 list-none">
              {filteredOptions.map((option, index) => (
                <li
                  key={option.key}
                  className={cx('px-3 py-2 text-sm cursor-pointer hover:bg-blue-100', index === highlightedIndex && 'bg-blue-50')}
                  onMouseDown={() => handleOptionSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  aria-selected={index === highlightedIndex}
                >
                  <Tag small className={option.className} title={option.title}>
                    {option.label}
                  </Tag>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );

  return isDefined(props.suggestedValue) ? (
    <div className="block relative w-full" onClick={stopPropagation} onDoubleClick={stopPropagation}>
      <div className="absolute top-0.5 right-0.5 z-10 flex gap-1">
        {/* visual indicator that the value is suggested */}
        {valueExternal === null ? (
          <Tooltip title="Valeur suggérée automatiquement">
            <Icon name="fr-icon-sparkling-2-line" size="xs" color="info" className="p-0.5 cursor-help" />
          </Tooltip>
        ) : (
          <Tooltip title={`Revoir la suggestion (${props.suggestedValue})`}>
            <button type="button" onClick={resetValue} className="-mt-0.5 p-0.5 hover:bg-gray-100 rounded-sm">
              <Icon name="fr-icon-refresh-line" size="xs" color="warning" />
            </button>
          </Tooltip>
        )}
      </div>
      {inputElement}
    </div>
  ) : (
    inputElement
  );
};

export default ChipAutoComplete;
