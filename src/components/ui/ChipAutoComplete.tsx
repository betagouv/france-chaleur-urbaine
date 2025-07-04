import Tag from '@codegouvfr/react-dsfr/Tag';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import cx from '@/utils/cx';

export type ChipOption = {
  key: string;
  label: string;
  title?: string;
  className?: string;
};

type ChipAutoCompletePropsBase = {
  options: ChipOption[];
  defaultOption: ChipOption;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

type ChipAutoCompletePropsMultiple = ChipAutoCompletePropsBase & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

type ChipAutoCompletePropsSingle = ChipAutoCompletePropsBase & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

export type ChipAutoCompleteProps = ChipAutoCompletePropsMultiple | ChipAutoCompletePropsSingle;

const ChipAutoComplete = (rawProps: ChipAutoCompleteProps) => {
  // keep props to allow type inference with multiple
  const props = { multiple: false, ...rawProps } satisfies ChipAutoCompleteProps;
  const { options, defaultOption, value, label, placeholder = 'Ajouter…', disabled = false, className } = props;
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const valueArray = Array.isArray(value) ? value : [value];

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

    props.multiple ? props.onChange([...valueArray, option.key]) : props.onChange(option.key);
  };

  const handleChipRemove = (chipName: string) => {
    props.multiple ? props.onChange(valueArray.filter((v) => v !== chipName)) : props.onChange('');
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
      handleChipRemove(valueArray[valueArray.length - 1]);
    }
  };

  return (
    <div className={cx('w-full', className)}>
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
              'flex flex-wrap items-center gap-1 border rounded pl-2 pr-4 py-1 bg-white focus-within:ring-2 ring-blue-00 min-h-[2.5rem] cursor-text',
              disabled && 'opacity-60 pointer-events-none'
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {valueArray.map((tagName) => {
              const chipOption = options.find((option) => option.key === tagName) ?? defaultOption;
              return (
                <Tag
                  key={tagName}
                  dismissible
                  small
                  className={chipOption?.className}
                  nativeButtonProps={{
                    title: chipOption?.title,
                    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handleChipRemove(tagName);
                    },
                  }}
                >
                  {chipOption.label || tagName}
                </Tag>
              );
            })}
            <input
              ref={inputRef}
              type="text"
              className="flex-1 min-w-[6ch] w-full !outline-none border-none bg-transparent text-sm py-1"
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
          <ul className="max-h-48 overflow-auto p-0 list-none">
            {filteredOptions.map((option, index) => (
              <li
                key={option.key}
                className={cx('px-3 py-2 text-sm cursor-pointer hover:bg-blue-100', index === highlightedIndex && 'bg-blue-50')}
                onMouseDown={() => handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                aria-selected={index === highlightedIndex}
                role="option"
              >
                <Tag small className={option.className} title={option.title}>
                  {option.label}
                </Tag>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ChipAutoComplete;
