import * as PopoverPrimitive from '@radix-ui/react-popover';
import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import Icon from '@/components/ui/Icon';
import cx from '@/utils/cx';

import { useDebouncedSwitchMap } from './useDebouncedSwitchMap';

export const DEFAULT_DEBOUNCE_TIME = 300;

export type AutocompleteProps<Option> = {
  fetchFn: (query: string, signal: AbortSignal) => Promise<Option[]>;
  getOptionValue: (option: Option) => string;
  getOptionLabel?: (option: Option, query: string) => React.ReactNode;
  onSelect: (option: Option) => void;
  onClear?: () => void;
  /** Called on selection or clear — for TanStack Form (field.handleChange) */
  onChange?: (value: string) => void;
  /** Controlled value — for TanStack Form (field.state.value) */
  value?: string;
  defaultValue?: string;
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

/**
 * Composant d'autocompletion générique avec dropdown en portail (Radix Popover),
 * navigation clavier accessible (WCAG 2.2 combobox) et debounce intégré.
 *
 * Le dropdown ne peut jamais être coupé par un `overflow: hidden` parent grâce
 * au portail Radix. Supporte les modes contrôlé (value) et non contrôlé (defaultValue).
 */
export function Autocomplete<Option>({
  fetchFn,
  getOptionValue,
  getOptionLabel,
  onSelect,
  onClear,
  onChange,
  value,
  defaultValue,
  minCharThreshold = 0,
  debounceTime = DEFAULT_DEBOUNCE_TIME,
  onLoadingChange,
  id: idProp,
  className,
  emptyMessage = 'Aucun résultat',
  errorMessage = 'La recherche a échoué, veuillez réessayer.',
  nativeInputProps,
}: AutocompleteProps<Option>) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;

  // Always initialize to '' to match SSR output and avoid hydration mismatches.
  // The actual initial value (from value/defaultValue props, which may come from
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
    if (!anchor) return;
    setAnchorWidth(anchor.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      setAnchorWidth(entries[0]?.contentRect.width);
    });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  // Apply the initial value after mount (client-only) to avoid SSR/CSR mismatch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const initial = value ?? defaultValue ?? '';
    if (initial) setDisplayValue(initial);
  }, []); // intentionally empty — runs once after mount

  // Controlled mode: sync displayValue when value prop changes externally (e.g. form reset).
  // prevValueRef starts as undefined so the first value change after mount is picked up.
  const prevValueRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (value !== undefined && value !== prevValueRef.current) {
      prevValueRef.current = value;
      cancel();
      setDisplayValue(value);
      setSuggestions([]);
      setHasNoResults(false);
      setHighlightedIndex(-1);
      setSearchQuery('');
      setFetchError(null);
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // cancel is stable, omitted intentionally

  // Keep fetchFn in a ref so the useDebouncedSwitchMap fn callback remains stable
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const { run, cancel, isRunning } = useDebouncedSwitchMap<string, Option[]>({
    debounce: debounceTime,
    fn: (query, signal) => fetchFnRef.current(query, signal),
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

  const selectOption = (option: Option) => {
    const optionValue = getOptionValue(option);
    cancel();
    setSuggestions([]);
    setHasNoResults(false);
    setHighlightedIndex(-1);
    setDisplayValue(optionValue);
    setSearchQuery('');
    setFetchError(null);
    setIsOpen(false);
    onChange?.(optionValue);
    onSelect(option);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    const trimmedQuery = query.trim();
    setDisplayValue(query);
    setSearchQuery(trimmedQuery);
    setFetchError(null);
    if (trimmedQuery.length >= minCharThreshold) {
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
      if (e.key === 'Escape') e.preventDefault();
      closePopover();
      return;
    }
    if (!isOpen || !suggestions.length) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          selectOption(suggestions[highlightedIndex]);
        }
        break;
    }
  };

  const handleClear = () => {
    cancel();
    setSuggestions([]);
    setHasNoResults(false);
    setHighlightedIndex(-1);
    setDisplayValue('');
    setSearchQuery('');
    setFetchError(null);
    setIsOpen(false);
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleInteractOutside = (e: Event) => {
    // Don't close if interaction is on the anchor (input + icons) itself
    const target = e.target as Node;
    if (anchorRef.current?.contains(target)) return;
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

  return (
    <div className={className}>
      <PopoverPrimitive.Root open={isOpen}>
        <PopoverPrimitive.Anchor asChild>
          <div ref={anchorRef} className="relative">
            <input
              ref={inputRef}
              id={id}
              type="text"
              role="combobox"
              aria-autocomplete="both"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-activedescendant={highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined}
              aria-busy={isRunning}
              value={displayValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              {...nativeInputProps}
              onFocus={handleFocus}
              autoComplete="off"
              className={cx('pr-10 text-ellipsis', nativeInputProps?.className)}
            />

            {isRunning && (
              <Oval
                height={16}
                width={16}
                color="var(--text-default-grey)"
                secondaryColor="var(--text-default-grey)"
                wrapperClass="absolute top-1/2 -translate-y-1/2 right-10 z-10"
              />
            )}

            {fetchError && !isRunning && (
              <Icon
                name="ri-alert-line"
                size="sm"
                color="var(--text-default-error)"
                title={fetchError}
                className="absolute top-1/2 -translate-y-1/2 right-10 z-10"
              />
            )}

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
        </PopoverPrimitive.Anchor>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={handleInteractOutside}
            avoidCollisions
            sideOffset={4}
            className="z-1751"
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
                <div className="text-sm py-2 px-3 text-(--text-mention-grey)">{emptyMessage}</div>
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
