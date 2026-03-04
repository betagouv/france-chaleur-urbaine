import type React from 'react';
import { useCallback } from 'react';

import { BAN_MIN_QUERY_LENGTH, searchBANAddresses } from '@/modules/ban/client';
import type { SuggestionItem } from '@/modules/ban/types';
import { normalize } from '@/utils/strings';

import { Autocomplete, type AutocompleteProps } from './Autocomplete';

export type AddressSearchProps = Omit<AutocompleteProps<SuggestionItem>, 'fetchFn' | 'getOptionValue'> & {
  onlyCities?: boolean;
  excludeCities?: boolean;
};

/**
 * Autocompletion d'adresse branchée sur l'API Base Adresse Nationale (BAN).
 * Wrapper autour de Autocomplete qui fournit le fetchFn et le formatage des résultats.
 *
 * Pour un usage dans un formulaire DSFR (label + hint + error), utiliser AddressField.
 */
export function AddressSearch({ onlyCities, excludeCities, ...props }: AddressSearchProps) {
  // useCallback ensures fetchFn identity is stable — prevents debounce restarts on re-renders
  const fetchFn = useCallback(
    (query: string, signal: AbortSignal) => searchBANAddresses({ excludeCities, onlyCities, query, signal }),
    [excludeCities, onlyCities]
  );

  const getOptionValue = useCallback(
    (opt: SuggestionItem) => (onlyCities ? `${opt.properties.city}, ${opt.properties.postcode}` : opt.properties.label),
    [onlyCities]
  );

  const getOptionLabel = useCallback((opt: SuggestionItem, query: string) => highlightMatch(getOptionValue(opt), query), [getOptionValue]);

  return (
    <Autocomplete
      fetchFn={fetchFn}
      minCharThreshold={BAN_MIN_QUERY_LENGTH}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      {...props}
    />
  );
}

/**
 * Highlights each word of `query` in `text`.
 * - Case-insensitive and accent-insensitive via normalize() ("e" matches "é" and vice versa)
 * - Wrapped in a <span> so whitespace is always preserved correctly in a flex container
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;

  const normalizedText = normalize(text);
  const pattern = new RegExp(words.map((w) => normalize(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of normalizedText.matchAll(pattern)) {
    if (match.index === undefined) continue;
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) segments.push(text.slice(lastIndex, start));
    segments.push(<strong key={start}>{text.slice(start, end)}</strong>);
    lastIndex = end;
  }

  if (lastIndex < text.length) segments.push(text.slice(lastIndex));

  return <>{segments}</>;
}
