import { Button } from '@codegouvfr/react-dsfr/Button';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import cx from '@/utils/cx';
import { normalize } from '@/utils/strings';

export type ComboBoxOption = {
  key: string;
  label: string;
  disabled?: boolean;
};

type ComboBoxBaseProps = {
  options: ComboBoxOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export type ComboBoxProps =
  | (ComboBoxBaseProps & {
      multiple: true;
      value: string[];
      onChange: (value: string[]) => void;
    })
  | (ComboBoxBaseProps & {
      multiple?: false;
      value: string;
      onChange: (value: string) => void;
    });

/**
 * Component to select one or multiple options from a list.
 */
const ComboBox = (rawProps: ComboBoxProps) => {
  const props = { multiple: false, placeholder: 'Sélectionner…', ...rawProps } satisfies ComboBoxProps;
  const { options, value, label, placeholder, disabled, className } = props;

  const comboboxId = useId();
  const listboxId = useId();
  const labelId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const valueArray = Array.isArray(value) ? value : [value].filter(Boolean);

  const filteredOptions = useMemo(() => {
    const searchQuery = normalize(query.trim());
    if (!searchQuery) return options;
    return options.filter((option) => normalize(option.label).includes(searchQuery));
  }, [options, query]);

  useEffect(() => {
    if (isOpen) {
      setHighlighted(0);
      // Focus sur l'input de recherche quand le menu s'ouvre
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, query, filteredOptions.length]);

  const selectOne = (option: ComboBoxOption) => {
    if (props.multiple) {
      if (isSelected(option.key)) {
        props.onChange(valueArray.filter((selectedKey) => selectedKey !== option.key));
      } else {
        props.onChange([...valueArray, option.key]);
      }
    } else {
      props.onChange(option.key);
      setIsOpen(false);
    }
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const unselectOne = (key: string) => {
    if (!props.multiple) {
      props.onChange('');
      return;
    }
    props.onChange(valueArray.filter((value) => value !== key));
  };

  const unselectAll = () => {
    if (props.multiple) {
      props.onChange([]);
    } else {
      props.onChange('');
    }
  };

  const isSelected = (key: string) => valueArray.includes(key);

  const displayedText = useMemo(() => {
    if (props.multiple) return valueArray.map((key) => options.find((option) => option.key === key)?.label || key).join(', ');
    if (!valueArray[0]) return '';
    return options.find((option) => option.key === valueArray[0])?.label || valueArray[0];
  }, [props.multiple, valueArray, options]);

  const activeOptionId = filteredOptions[highlighted] ? `${listboxId}-option-${filteredOptions[highlighted].key}` : undefined;

  return (
    <div className={cx('fr-input-group w-full', className)}>
      {label && (
        <label id={labelId} className="fr-label mb-2" htmlFor={comboboxId}>
          {label}
        </label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            id={comboboxId}
            role="combobox"
            className={cx(
              'fr-select w-full relative flex items-center gap-2 pr-9 text-left cursor-pointer',
              'bg-none', // supprime le chevron ajouté par fr-select, on a le notre avec animation
              disabled && 'opacity-60 pointer-events-none cursor-not-allowed'
            )}
            onClick={() => setIsOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsOpen((open) => !open);
              } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!isOpen) {
                  setIsOpen(true);
                } else {
                  // Si le menu est déjà ouvert, déplacer le focus vers le premier élément
                  setHighlighted(0);
                }
              } else if (event.key === 'ArrowUp' && isOpen) {
                event.preventDefault();
                // Dans le combobox, ArrowUp peut aller au dernier élément
                setHighlighted(filteredOptions.length > 0 ? filteredOptions.length - 1 : 0);
              } else if (event.key === 'Escape' && isOpen) {
                event.preventDefault();
                setIsOpen(false);
              }
            }}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={isOpen && activeOptionId ? activeOptionId : undefined}
            aria-autocomplete="list"
            aria-labelledby={label ? labelId : undefined}
            aria-label={!label ? placeholder : undefined}
            tabIndex={disabled ? -1 : 0}
          >
            <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
              {props.multiple ? (
                valueArray.length > 0 ? (
                  valueArray.map((key) => {
                    const optionLabel = options.find((option) => option.key === key)?.label || key;
                    return (
                      <Tag
                        key={key}
                        dismissible
                        small
                        nativeButtonProps={{
                          onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            unselectOne(key);
                          },
                          title: optionLabel,
                        }}
                      >
                        {optionLabel}
                      </Tag>
                    );
                  })
                ) : (
                  <span className="text-gray-500">{placeholder}</span>
                )
              ) : (
                <span className={cx('truncate', !displayedText && 'text-gray-500')}>{displayedText || placeholder}</span>
              )}
            </div>
            <span className="absolute right-2 pointer-events-none flex items-center justify-center w-6 h-full">
              <Icon name="fr-icon-arrow-down-s-line" size="sm" className={cx('transition-transform', isOpen && 'rotate-180')} />
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent
          sideOffset={0}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="border border-solid border-gray-300 shadow-lg"
        >
          {props.multiple && (
            <div className="p-2 border-b border-solid border-gray-200">
              <Button
                priority="tertiary"
                size="small"
                iconId="fr-icon-close-circle-line"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  unselectAll();
                }}
                disabled={valueArray.length === 0}
              >
                Tout désélectionner
              </Button>
            </div>
          )}
          <div className="p-2 border-b border-solid border-gray-200 relative">
            <input
              ref={inputRef}
              type="text"
              className="fr-input w-full pr-10"
              placeholder="Rechercher…"
              value={query}
              aria-label="Rechercher dans les options"
              aria-controls={listboxId}
              aria-autocomplete="list"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setHighlighted((index) => (index + 1) % Math.max(filteredOptions.length, 1));
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setHighlighted((index) => (index - 1 + Math.max(filteredOptions.length, 1)) % Math.max(filteredOptions.length, 1));
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  const option = filteredOptions[highlighted];
                  if (option) selectOne(option);
                } else if (event.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon name="fr-icon-search-line" size="sm" />
            </span>
          </div>
          <ul id={listboxId} role="listbox" className="max-h-60 overflow-auto pl-0 my-0">
            {filteredOptions.map((option, index) => {
              const optionId = `${listboxId}-option-${option.key}`;
              return (
                <li
                  key={`${option.key}-${isSelected(option.key) ? 'selected' : 'unselected'}`}
                  id={optionId}
                  role="option"
                  tabIndex={-1}
                  aria-selected={isSelected(option.key)}
                  aria-disabled={option.disabled ? 'true' : undefined}
                  className={cx(
                    'cursor-pointer flex items-center py-2',
                    index === highlighted && 'bg-blue-50',
                    option.disabled && 'opacity-60 cursor-not-allowed'
                  )}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={(event) => {
                    event.preventDefault();
                    if (option.disabled) return;
                    selectOne(option);
                  }}
                >
                  {props.multiple ? (
                    <div className="fr-checkbox-group fr-checkbox-group--sm flex-shrink-0 ml-3">
                      <input
                        type="checkbox"
                        id={`${optionId}-checkbox`}
                        value={option.key}
                        name={`${listboxId}-checkboxes`}
                        data-fr-js-checkbox-input="true"
                        checked={isSelected(option.key)}
                        readOnly
                        tabIndex={-1}
                        // onChange géré par le onClick du li
                      />
                      <label className="fr-label" htmlFor={`${optionId}-checkbox`}>
                        {option.label}
                      </label>
                    </div>
                  ) : (
                    <span className={cx('fr-icon-check-line flex-shrink-0 ml-3', isSelected(option.key) ? 'opacity-100' : 'opacity-0')} />
                  )}
                  {!props.multiple && <span className="truncate ml-3">{option.label}</span>}
                </li>
              );
            })}
            {filteredOptions.length === 0 && (
              <li className="py-2 pl-3 text-gray-500" style={{ paddingLeft: '0.75rem' }} role="status" aria-live="polite">
                Aucun résultat
              </li>
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ComboBox;
