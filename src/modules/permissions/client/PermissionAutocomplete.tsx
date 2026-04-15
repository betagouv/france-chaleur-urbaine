import { useEffect, useRef, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

import { permissionTypeLabels } from '../constants';
import type { Permission, PermissionType } from '../types';

const networkTypes: PermissionType[] = ['reseau_existant', 'reseau_en_construction'];
const territoryTypes: PermissionType[] = ['commune', 'epci', 'ept', 'departement', 'region'];

type PermissionAutocompleteProps = {
  availableTypes: readonly PermissionType[];
  onAdd: (permission: Permission) => void;
};

/**
 * Unified autocomplete for searching networks or territories.
 * Searches by name/id and displays results with type badges.
 */
const PermissionAutocomplete = ({ availableTypes, onAdd }: PermissionAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const isNetworkMode = availableTypes.some((t) => networkTypes.includes(t));
  const isTerritoryMode = availableTypes.some((t) => territoryTypes.includes(t));

  const networkResults = trpc.permissions.searchNetworks.useQuery(
    { query: debouncedQuery },
    { enabled: isNetworkMode && debouncedQuery.length >= 2 }
  );

  const territoryResults = trpc.permissions.searchTerritories.useQuery(
    { query: debouncedQuery, types: availableTypes.filter((t) => territoryTypes.includes(t)) },
    { enabled: isTerritoryMode && debouncedQuery.length >= 2 }
  );

  type ResultItem = {
    label: string;
    sublabel?: string;
    permission: Permission;
  };

  const results: ResultItem[] = [];

  if (isNetworkMode && networkResults.data) {
    for (const n of networkResults.data) {
      if (!availableTypes.includes(n.type)) continue;
      results.push({
        label: n.name,
        permission: { resourceId: String(n.idFcu), type: n.type },
        sublabel: `${permissionTypeLabels[n.type]} · ${n.sncuId ?? `FCU ${n.idFcu}`}${n.gestionnaire ? ` · ${n.gestionnaire}` : ''}`,
      });
    }
  }

  if (isTerritoryMode && territoryResults.data) {
    for (const t of territoryResults.data) {
      results.push({
        label: t.label,
        permission: { resourceId: t.code, type: t.type } as Permission,
        sublabel: `${permissionTypeLabels[t.type]} · ${t.code}`,
      });
    }
  }

  // National option always available for territory modes
  if (isTerritoryMode && availableTypes.includes('national' as PermissionType) && !debouncedQuery) {
    results.unshift({
      label: 'National (tout le territoire)',
      permission: { resourceId: null, type: 'national' },
      sublabel: 'Accès à toutes les demandes',
    });
  }

  const handleSelect = (item: ResultItem) => {
    onAdd(item.permission);
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && isOpen && results[highlightedIndex]) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const showPopover = isOpen && query.length >= 2 && (results.length > 0 || networkResults.isFetching || territoryResults.isFetching);

  return (
    <Popover open={showPopover} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <input
          ref={inputRef}
          type="text"
          className="fr-input"
          placeholder={
            isNetworkMode && isTerritoryMode
              ? 'Rechercher un réseau ou un territoire...'
              : isNetworkMode
                ? 'Rechercher par nom, ID FCU ou ID SNCU...'
                : 'Rechercher par nom ou code...'
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </PopoverTrigger>
      <PopoverContent
        sideOffset={4}
        className="w-(--radix-popover-trigger-width)"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <ul className="max-h-64 overflow-auto p-0 list-none">
          {(networkResults.isFetching || territoryResults.isFetching) && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-faded">Recherche...</li>
          )}
          {!networkResults.isFetching && !territoryResults.isFetching && results.length === 0 && debouncedQuery.length >= 2 && (
            <li className="px-3 py-2 text-sm text-faded">Aucun résultat</li>
          )}
          {results.map((item, index) => (
            <li
              key={`${item.permission.type}-${item.permission.resourceId}`}
              className={cx('px-3 py-2 cursor-pointer hover:bg-blue-100', index === highlightedIndex && 'bg-blue-50')}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="text-sm font-medium">{item.label}</div>
              {item.sublabel && <div className="text-xs text-faded">{item.sublabel}</div>}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default PermissionAutocomplete;
