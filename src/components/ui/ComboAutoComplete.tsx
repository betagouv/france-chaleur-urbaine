import { Button } from '@codegouvfr/react-dsfr/Button';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { useEffect, useId, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import Icon from '@/components/ui/Icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useDebouncedSwitchMap } from '@/modules/form/useDebouncedSwitchMap';
import cx from '@/utils/cx';

export type ComboAutoCompleteItem = { key: string; label: string };

type ComboAutoCompleteProps<Option> = {
  fetchFn: (query: string, signal: AbortSignal) => Promise<Option[]>;
  getOptionKey: (option: Option) => string;
  getOptionLabel: (option: Option) => string;
  value: ComboAutoCompleteItem[];
  onChange: (value: ComboAutoCompleteItem[]) => void;
  isLoading?: boolean;
  label?: string;
  placeholder?: string;
  debounceTime?: number;
  minCharThreshold?: number;
  className?: string;
};

/**
 * Async multi-select with search, checkboxes, and tags in the trigger zone.
 * Combines ComboBox's multi-select UX with Autocomplete's async search.
 */
export function ComboAutoComplete<Option>({
  fetchFn,
  getOptionKey,
  getOptionLabel,
  value,
  onChange,
  isLoading = false,
  label,
  placeholder = 'Sélectionner…',
  debounceTime = 300,
  minCharThreshold = 0,
  className,
}: ComboAutoCompleteProps<Option>) {
  const comboboxId = useId();
  const listboxId = useId();
  const labelId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Option[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedKeys = new Set(value.map((item) => item.key));

  // Keep fetchFn in a ref so the useDebouncedSwitchMap callback remains stable
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const { run, cancel, isRunning } = useDebouncedSwitchMap<string, Option[]>({
    debounce: debounceTime,
    fn: (q, signal) => fetchFnRef.current(q, signal),
    onError: (error) => {
      setFetchError(error.message);
      setSuggestions([]);
    },
    onSuccess: (results) => {
      setSuggestions(results);
      setHighlighted(0);
      setFetchError(null);
    },
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      // Reset search state when closing
      cancel();
      setQuery('');
      setSuggestions([]);
      setHighlighted(0);
      setFetchError(null);
    }
  }, [isOpen, cancel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setFetchError(null);
    const trimmed = q.trim();
    if (trimmed.length >= minCharThreshold) {
      run(trimmed);
    } else {
      cancel();
      setSuggestions([]);
    }
  };

  const toggleOption = (option: Option) => {
    const key = getOptionKey(option);
    if (selectedKeys.has(key)) {
      onChange(value.filter((item) => item.key !== key));
    } else {
      onChange([...value, { key, label: getOptionLabel(option) }]);
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const unselectOne = (key: string) => {
    onChange(value.filter((item) => item.key !== key));
  };

  const unselectAll = () => {
    onChange([]);
  };

  const activeOptionId = suggestions[highlighted] ? `${listboxId}-option-${getOptionKey(suggestions[highlighted])}` : undefined;

  const belowThreshold = minCharThreshold > 0 && query.trim().length < minCharThreshold;

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
              'bg-none' // supprime le chevron ajouté par fr-select
            )}
            onClick={() => setIsOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsOpen((open) => !open);
              } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                setIsOpen(true);
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
            tabIndex={0}
          >
            <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
              {value.length === 0 ? (
                <span className="text-gray-500">{placeholder}</span>
              ) : isLoading ? (
                <div className="flex flex-wrap gap-1">
                  {value.map((item) => (
                    <span key={item.key} className="inline-block h-5 w-20 rounded-full bg-gray-200 animate-pulse" />
                  ))}
                </div>
              ) : value.length === 1 ? (
                <Tag
                  key={value[0].key}
                  dismissible
                  small
                  nativeButtonProps={{
                    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
                      event.stopPropagation();
                      unselectOne(value[0].key);
                    },
                    title: value[0].label,
                  }}
                >
                  {value[0].label}
                </Tag>
              ) : (
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 whitespace-nowrap">
                  {value.length} sélectionnés
                </span>
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
          className="border border-solid border-gray-300 shadow-lg max-w-96"
        >
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
              disabled={value.length === 0}
            >
              Tout désélectionner
            </Button>
          </div>
          {value.length > 0 && (
            <div className="flex flex-wrap gap-1 p-2 border-b border-solid border-gray-200 max-h-28 overflow-auto">
              {isLoading
                ? value.map((item) => <span key={item.key} className="inline-block h-6 w-24 rounded-full bg-gray-200 animate-pulse" />)
                : value.map((item) => (
                    <Tag
                      key={item.key}
                      dismissible
                      small
                      nativeButtonProps={{
                        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
                          event.stopPropagation();
                          unselectOne(item.key);
                        },
                        title: item.label,
                      }}
                    >
                      {item.label}
                    </Tag>
                  ))}
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
              aria-busy={isRunning}
              onChange={handleInputChange}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setHighlighted((i) => (i + 1) % Math.max(suggestions.length, 1));
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setHighlighted((i) => (i - 1 + Math.max(suggestions.length, 1)) % Math.max(suggestions.length, 1));
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  const option = suggestions[highlighted];
                  if (option) toggleOption(option);
                } else if (event.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
              {isRunning && <Oval height={16} width={16} color="var(--text-default-grey)" secondaryColor="var(--text-default-grey)" />}
              {fetchError && !isRunning && <Icon name="ri-alert-line" size="sm" color="var(--text-default-error)" title={fetchError} />}
              {!isRunning && !fetchError && <Icon name="fr-icon-search-line" size="sm" />}
            </span>
          </div>
          <ul id={listboxId} role="listbox" className="max-h-60 overflow-auto pl-0 my-0">
            {suggestions.map((option, index) => {
              const key = getOptionKey(option);
              const optionLabel = getOptionLabel(option);
              const selected = selectedKeys.has(key);
              const optionId = `${listboxId}-option-${key}`;
              return (
                <li
                  key={`${key}-${selected ? 'selected' : 'unselected'}`}
                  id={optionId}
                  role="option"
                  tabIndex={-1}
                  aria-selected={selected}
                  className={cx('cursor-pointer flex items-center py-2', index === highlighted && 'bg-blue-50')}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={(event) => {
                    event.preventDefault();
                    toggleOption(option);
                  }}
                >
                  <div className="fr-checkbox-group fr-checkbox-group--sm shrink-0 ml-3">
                    <input
                      type="checkbox"
                      id={`${optionId}-checkbox`}
                      value={key}
                      name={`${listboxId}-checkboxes`}
                      data-fr-js-checkbox-input="true"
                      checked={selected}
                      readOnly
                      tabIndex={-1}
                    />
                    <label className="fr-label" htmlFor={`${optionId}-checkbox`}>
                      {optionLabel}
                    </label>
                  </div>
                </li>
              );
            })}
            {suggestions.length === 0 && !isRunning && (
              <li className="py-2 pl-3 text-gray-500" role="status" aria-live="polite">
                {belowThreshold
                  ? `Saisissez au moins ${minCharThreshold} caractères`
                  : query.trim()
                    ? 'Aucun résultat'
                    : 'Commencez à taper pour rechercher'}
              </li>
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
