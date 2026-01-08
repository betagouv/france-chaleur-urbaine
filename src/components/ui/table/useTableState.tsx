import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import React from 'react';

import { useTableUrlState } from '@/components/ui/table/useTableUrlState';

type UseTableStateResult = {
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  setColumnFilters: (value: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void;
  setGlobalFilter: (value: string) => void;
  setSorting: (value: SortingState | ((prev: SortingState) => SortingState)) => void;
  sorting: SortingState;
};

/**
 * Hook qui gère l'état du tableau (tri, filtres, recherche globale).
 * Si urlSyncKey est fourni, l'état est synchronisé avec l'URL, sinon il est géré localement.
 */
export const useTableState = (
  urlSyncKey: string | undefined,
  initialSortingState: SortingState | undefined,
  defaultColumnFilters: ColumnFiltersState | undefined,
  externalGlobalFilter: string | undefined
): UseTableStateResult => {
  // Toujours appeler le hook pour respecter les règles de React
  // Le hook gère lui-même le cas où urlSyncKey est undefined
  const urlState = useTableUrlState(urlSyncKey, {
    columnFilters: defaultColumnFilters,
    globalFilter: externalGlobalFilter,
    sorting: initialSortingState,
  });

  // États locaux utilisés uniquement si urlSyncKey n'est pas activé
  const [localGlobalFilter, setLocalGlobalFilter] = React.useState<string>('');
  const [localSortingState, setLocalSortingState] = React.useState<SortingState>(initialSortingState ?? []);
  const [localColumnFilters, setLocalColumnFilters] = React.useState<ColumnFiltersState>(defaultColumnFilters ?? []);

  // Synchronise les filtres locaux avec les props si urlSyncKey n'est pas activé
  React.useEffect(() => {
    if (!urlSyncKey) {
      setLocalColumnFilters(defaultColumnFilters ?? []);
    }
  }, [defaultColumnFilters, urlSyncKey]);

  // Retourne l'état synchronisé avec l'URL si urlSyncKey est activé
  if (urlSyncKey) {
    return {
      columnFilters: urlState.state.columnFilters ?? [],
      globalFilter: urlState.state.globalFilter ?? '',
      setColumnFilters: urlState.setColumnFilters,
      setGlobalFilter: urlState.setGlobalFilter,
      setSorting: urlState.setSorting,
      sorting: urlState.state.sorting ?? [],
    };
  }

  // Retourne l'état local si urlSyncKey n'est pas activé
  return {
    columnFilters: localColumnFilters,
    globalFilter: localGlobalFilter,
    setColumnFilters: setLocalColumnFilters,
    setGlobalFilter: setLocalGlobalFilter,
    setSorting: setLocalSortingState,
    sorting: localSortingState,
  };
};
