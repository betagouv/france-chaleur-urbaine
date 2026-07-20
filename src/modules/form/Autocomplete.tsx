import * as PopoverPrimitive from '@radix-ui/react-popover';
import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import Icon from '@/components/ui/Icon';
import Tag from '@/components/ui/Tag';
import cx from '@/utils/cx';

import { useDebouncedSwitchMap } from './useDebouncedSwitchMap';

export const DEFAULT_DEBOUNCE_TIME = 300;

type AutocompleteBaseProps<Option> = {
  /** Async source of suggestions. Optional in multiple mode (omit for a pure free-text tags field). */
  fetchFn?: (query: string, signal: AbortSignal) => Promise<Option[]>;
  getOptionValue: (option: Option) => string;
  getOptionLabel?: (option: Option, query: string) => React.ReactNode;
  minCharThreshold?: number;
  debounceTime?: number;
  onLoadingChange?: (loading: boolean) => void;
  id?: string;
  className?: string;
  /** Message affiché quand la recherche aboutit avec 0 résultat. Défaut : "Aucun résultat". */
  emptyMessage?: React.ReactNode;
  /** Message affiché dans le dropdown quand la recherche échoue (réseau/serveur). Défaut : message générique. */
  errorMessage?: React.ReactNode;
  nativeInputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'>;
};

export type AutocompleteSingleProps<Option> = AutocompleteBaseProps<Option> & {
  multiple?: false;
  /** Required in single mode. */
  fetchFn: (query: string, signal: AbortSignal) => Promise<Option[]>;
  onSelect: (option: Option) => void;
  onClear?: () => void;
  /** Called on selection or clear — for TanStack Form (field.handleChange) */
  onChange?: (value: string) => void;
  /** Controlled value — for TanStack Form (field.state.value) */
  value?: string;
  defaultValue?: string;
};

export type AutocompleteMultipleProps<Option> = AutocompleteBaseProps<Option> & {
  multiple: true;
  /** Selected tag values (controlled). */
  values: string[];
  /** Called when a tag is added or removed. */
  onValuesChange: (values: string[]) => void;
  /** Enter adds the trimmed input as a tag when no suggestion is highlighted. */
  allowFreeText?: boolean;
  /** Optional side-effect when a suggestion is picked. */
  onSelect?: (option: Option) => void;
};

export type AutocompleteProps<Option> = AutocompleteSingleProps<Option> | AutocompleteMultipleProps<Option>;

/**
 * ri-alert-line inlined: DSFR icons fetch their glyph via mask-image (network), which fails
 * offline — exactly when this error icon is needed. Decorative (message announced by the alert).
 */
const OfflineAlertIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={cx('size-4 text-(--text-default-error)', className)}>
    <path d="M12.8659 3.00017L22.3922 19.5002C22.6684 19.9785 22.5045 20.5901 22.0262 20.8662C21.8742 20.954 21.7017 21.0002 21.5262 21.0002H2.47363C1.92135 21.0002 1.47363 20.5525 1.47363 20.0002C1.47363 19.8246 1.51984 19.6522 1.60761 19.5002L11.1339 3.00017C11.41 2.52187 12.0216 2.358 12.4999 2.63414C12.6519 2.72191 12.7782 2.84815 12.8659 3.00017ZM4.20568 19.0002H19.7941L11.9999 5.50017L4.20568 19.0002ZM10.9999 16.0002H12.9999V18.0002H10.9999V16.0002ZM10.9999 9.00017H12.9999V14.0002H10.9999V9.00017Z" />
  </svg>
);

/**
 * Composant d'autocompletion générique avec dropdown en portail (Radix Popover),
 * navigation clavier accessible (WCAG 2.2 combobox) et debounce intégré.
 *
 * Deux modes (discriminés par `multiple`) :
 * - **mono** (défaut) : un seul `value` affiché dans l'input ; modes contrôlé (`value`) et non contrôlé (`defaultValue`).
 * - **multiple** : tags inline dans le champ, `values`/`onValuesChange` contrôlés ; `allowFreeText` ajoute la saisie
 *   libre à l'Entrée, Backspace sur input vide retire le dernier tag. `fetchFn` optionnel (champ texte-libre pur).
 *
 * Le dropdown ne peut jamais être coupé par un `overflow: hidden` parent grâce au portail Radix.
 */
export function Autocomplete<Option>(props: AutocompleteProps<Option>) {
  const {
    fetchFn,
    getOptionValue,
    getOptionLabel,
    minCharThreshold = 0,
    debounceTime = DEFAULT_DEBOUNCE_TIME,
    onLoadingChange,
    id: idProp,
    className,
    emptyMessage = 'Aucun résultat',
    errorMessage = 'La recherche a échoué, veuillez réessayer.',
    nativeInputProps,
  } = props;

  const multiple = props.multiple === true;
  const allowFreeText = props.multiple === true && props.allowFreeText === true;

  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;

  // Always initialize to '' to match SSR output and avoid hydration mismatches.
  // The actual initial value (single mode, from value/defaultValue which may come from
  // client-only sources like localStorage) is applied in a useEffect after mount.
  const [displayValue, setDisplayValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Option[]>([]);
  const [hasNoResults, setHasNoResults] = useState(false);
  // Open state is decoupled from the presence of suggestions so the dropdown can be
  // closed (click outside, Escape) while keeping the last results in memory, then
  // reopened on focus without re-fetching.
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [anchorWidth, setAnchorWidth] = useState<number | undefined>(undefined);

  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Measure anchor width so the popover matches the input's width
  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }
    setAnchorWidth(anchor.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      setAnchorWidth(entries[0]?.contentRect.width);
    });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  // Single mode: apply the initial value after mount (client-only) to avoid SSR/CSR mismatch.
  useEffect(() => {
    if (props.multiple) {
      return;
    }
    const initial = props.value ?? props.defaultValue ?? '';
    if (initial) {
      setDisplayValue(initial);
    }
  }, []);

  // Single controlled mode: sync displayValue when value prop changes externally (e.g. form reset).
  // prevValueRef starts as undefined so the first value change after mount is picked up.
  const prevValueRef = useRef<string | undefined>(undefined);
  const controlledValue = props.multiple ? undefined : props.value;
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== prevValueRef.current) {
      prevValueRef.current = controlledValue;
      cancel();
      setDisplayValue(controlledValue);
      setSuggestions([]);
      setHasNoResults(false);
      setHighlightedIndex(-1);
      setSearchQuery('');
      setFetchError(null);
      setIsOpen(false);
    }
  }, [controlledValue]);

  // Keep fetchFn in a ref so the useDebouncedSwitchMap fn callback remains stable
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const { run, cancel, isRunning } = useDebouncedSwitchMap<string, Option[]>({
    debounce: debounceTime,
    fn: (query, signal) => fetchFnRef.current?.(query, signal) ?? Promise.resolve([]),
    onError: (error) => {
      setFetchError(error.message);
      setSuggestions([]);
      setHasNoResults(false);
      // Open the dropdown so the error is readable (the alert icon's tooltip is unusable on touch).
      setIsOpen(true);
    },
    onSuccess: (results) => {
      setSuggestions(results);
      setHasNoResults(results.length === 0);
      setHighlightedIndex(-1);
      setFetchError(null);
      setIsOpen(true);
    },
  });

  // Notify parent of loading state changes
  const onLoadingChangeRef = useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;
  useEffect(() => {
    onLoadingChangeRef.current?.(isRunning);
  }, [isRunning]);

  const resetSearch = () => {
    cancel();
    setSuggestions([]);
    setHasNoResults(false);
    setHighlightedIndex(-1);
    setSearchQuery('');
    setFetchError(null);
    setIsOpen(false);
  };

  const addTag = (raw: string) => {
    if (!props.multiple) {
      return;
    }
    const value = raw.trim();
    if (!value || props.values.includes(value)) {
      return;
    }
    props.onValuesChange([...props.values, value]);
  };

  const removeTag = (value: string) => {
    if (!props.multiple) {
      return;
    }
    props.onValuesChange(props.values.filter((v) => v !== value));
  };

  const selectOption = (option: Option) => {
    const optionValue = getOptionValue(option);
    resetSearch();
    setDisplayValue(props.multiple ? '' : optionValue);
    if (props.multiple) {
      addTag(optionValue);
      props.onSelect?.(option);
    } else {
      props.onChange?.(optionValue);
      props.onSelect(option);
    }
  };

  const submitFreeText = (): boolean => {
    if (!allowFreeText || !displayValue.trim()) {
      return false;
    }
    addTag(displayValue);
    setDisplayValue('');
    resetSearch();
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    const trimmedQuery = query.trim();
    setDisplayValue(query);
    setSearchQuery(trimmedQuery);
    setFetchError(null);
    if (fetchFn && trimmedQuery.length >= minCharThreshold) {
      run(trimmedQuery);
    } else {
      cancel();
      setSuggestions([]);
      setHasNoResults(false);
      setIsOpen(false);
    }
  };

  // Close the dropdown but keep suggestions/hasNoResults in memory so focus can reopen them.
  const closePopover = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Escape' || e.key === 'Tab') && isOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
      }
      closePopover();
      return;
    }
    if (props.multiple && e.key === 'Backspace' && displayValue === '' && props.values.length > 0) {
      removeTag(props.values[props.values.length - 1]);
      return;
    }
    if (e.key === 'ArrowDown' && isOpen && suggestions.length) {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp' && isOpen && suggestions.length) {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault();
        selectOption(suggestions[highlightedIndex]);
      } else if (submitFreeText()) {
        e.preventDefault();
      }
    }
  };

  const handleClear = () => {
    resetSearch();
    setDisplayValue('');
    if (!props.multiple) {
      props.onChange?.('');
      props.onClear?.();
    }
    inputRef.current?.focus();
  };

  const handleInteractOutside = (e: Event) => {
    // Don't close if interaction is on the anchor (input + icons) itself
    const target = e.target as Node;
    if (anchorRef.current?.contains(target)) {
      return;
    }
    closePopover();
  };

  // Reopen the previously fetched results when the user returns to the field
  // (e.g. after clicking outside or pressing Escape), without re-querying.
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    nativeInputProps?.onFocus?.(e);
    if (suggestions.length > 0 || hasNoResults || fetchError !== null) {
      setIsOpen(true);
    }
  };

  // Free-text mode hints that Enter adds the typed value; otherwise the plain empty message.
  const emptyContent =
    allowFreeText && searchQuery ? (
      <>
        Appuyez sur <b>Entrée</b> pour ajouter «&nbsp;{searchQuery}&nbsp;»
      </>
    ) : (
      emptyMessage
    );

  const sharedInputProps = {
    'aria-activedescendant': highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined,
    'aria-autocomplete': (multiple ? 'list' : 'both') as 'list' | 'both',
    'aria-busy': isRunning,
    'aria-controls': listboxId,
    'aria-expanded': isOpen,
    autoComplete: 'off' as const,
    id,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    role: 'combobox' as const,
    type: 'text' as const,
    value: displayValue,
  };

  return (
    <div className={className}>
      <PopoverPrimitive.Root open={isOpen}>
        <PopoverPrimitive.Anchor asChild>
          {multiple ? (
            <div
              ref={anchorRef}
              onClick={() => inputRef.current?.focus()}
              className={cx(
                // Mirrors `.fr-input`: contrast-grey bg, 2px bottom border, top-rounded corners,
                // and the DSFR focus outline (2px #0a76f6, offset 2px) lifted to the whole box.
                'relative flex min-h-10 w-full cursor-text flex-wrap items-center gap-1 rounded-t-sm px-2 py-1',
                'text-(--text-default-grey) bg-(--background-contrast-grey) shadow-[inset_0_-2px_0_0_var(--border-plain-grey)]',
                'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0a76f6]'
              )}
            >
              {props.multiple &&
                props.values.map((value) => (
                  <Tag
                    key={value}
                    size="sm"
                    dismissible
                    nativeButtonProps={{ 'aria-label': `Retirer ${value}`, onClick: () => removeTag(value) }}
                  >
                    {value}
                  </Tag>
                ))}
              <input
                ref={inputRef}
                {...nativeInputProps}
                {...sharedInputProps}
                onFocus={handleFocus}
                className="min-w-[8ch] flex-1 bg-transparent outline-hidden placeholder:italic placeholder:text-(--text-mention-grey)"
              />
              {isRunning && (
                <Oval
                  height={16}
                  width={16}
                  strokeWidth={4}
                  color="var(--text-action-high-blue-france)"
                  secondaryColor="var(--border-default-grey)"
                  wrapperClass="ml-auto self-center"
                />
              )}
              {fetchError && !isRunning && <OfflineAlertIcon className="ml-auto self-center" />}
            </div>
          ) : (
            <div ref={anchorRef} className="relative">
              <input
                ref={inputRef}
                {...sharedInputProps}
                {...nativeInputProps}
                onFocus={handleFocus}
                className={cx('pr-10 text-ellipsis', nativeInputProps?.className)}
              />

              {isRunning && (
                <Oval
                  height={16}
                  width={16}
                  strokeWidth={4}
                  color="var(--text-action-high-blue-france)"
                  secondaryColor="var(--border-default-grey)"
                  wrapperClass="absolute top-1/2 -translate-y-1/2 right-10 z-10"
                />
              )}

              {fetchError && !isRunning && <OfflineAlertIcon className="absolute top-1/2 -translate-y-1/2 right-10 z-10" />}

              {displayValue ? (
                <Icon
                  size="sm"
                  name="ri-close-line"
                  color="var(--text-default-grey)"
                  title="Effacer"
                  className="absolute top-1/2 -translate-y-1/2 right-4 z-10 cursor-pointer"
                  onClick={handleClear}
                />
              ) : (
                <Icon
                  size="sm"
                  name="ri-search-line"
                  color="var(--text-default-grey)"
                  title="Rechercher"
                  className="absolute top-1/2 -translate-y-1/2 right-4 z-10"
                />
              )}
            </div>
          )}
        </PopoverPrimitive.Anchor>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={handleInteractOutside}
            avoidCollisions
            sideOffset={4}
            className="z-2004" // above Dialog content (z-2003) so the dropdown stays visible inside dialogs
            style={{ width: anchorWidth ? `${anchorWidth}px` : undefined }}
          >
            <div role="status" aria-live="polite" className="sr-only">
              {/* Error is announced by the visible role="alert" below, not here */}
              {isOpen && !fetchError
                ? suggestions.length > 0
                  ? `${suggestions.length} résultat${suggestions.length > 1 ? 's' : ''}`
                  : 'Aucun résultat'
                : ''}
            </div>
            <div className="bg-(--background-default-grey) border border-(--border-default-grey) shadow-[0_4px_8px_rgba(0,0,0,0.12)]">
              {fetchError ? (
                <div role="alert" className="text-sm py-2 px-3 text-(--text-default-error)">
                  {errorMessage}
                </div>
              ) : suggestions.length > 0 ? (
                <ul
                  id={listboxId}
                  role="listbox"
                  aria-label="Suggestions"
                  // onMouseDown prevents input blur before option click fires (blur-before-click race)
                  onMouseDown={(e) => e.preventDefault()}
                  className="list-none m-0 p-0 max-h-80 overflow-y-auto"
                >
                  {suggestions.map((option, index) => {
                    const optionValue = getOptionValue(option);
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <li
                        key={`${optionValue}_${index}`}
                        id={`${id}-option-${index}`}
                        role="option"
                        aria-selected={isHighlighted}
                        tabIndex={-1}
                        className={cx(
                          'cursor-pointer text-sm min-h-9 py-1 px-3 content-center',
                          isHighlighted ? 'bg-(--background-active-blue-france) text-white' : 'bg-(--background-default-grey)'
                        )}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onMouseLeave={() => setHighlightedIndex(-1)}
                        onClick={() => selectOption(option)}
                      >
                        {getOptionLabel ? getOptionLabel(option, searchQuery) : optionValue}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm py-2 px-3 text-(--text-mention-grey)">{emptyContent}</div>
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
