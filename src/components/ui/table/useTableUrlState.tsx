import { usePrevious } from '@react-hookz/web';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { parseAsJson, parseAsString, useQueryState } from 'nuqs';
import { useEffect, useMemo } from 'react';

export type TableUrlState = {
  globalFilter?: string;
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;
};

export const useTableUrlState = (prefix: string | undefined, initialValues?: TableUrlState) => {
  // Utilise une clé par défaut unique si prefix n'est pas fourni pour éviter les conflits
  // Le hook sera toujours appelé pour respecter les règles de React, mais ne sera pas utilisé si prefix est undefined
  const effectivePrefix = prefix ?? '__internal_unused_table_state__';
  const previousInitialValues = usePrevious(initialValues);

  const [urlGlobalFilter, setUrlGlobalFilter] = useQueryState(`${effectivePrefix}_search`, parseAsString.withDefault(''));

  const [urlSorting, setUrlSorting] = useQueryState(
    `${effectivePrefix}_sort`,
    parseAsJson<SortingState>((value) => value as SortingState).withDefault([])
  );

  const [urlColumnFilters, setUrlColumnFilters] = useQueryState(
    `${effectivePrefix}_filters`,
    parseAsJson<ColumnFiltersState>((value) => value as ColumnFiltersState).withDefault([])
  );

  useEffect(() => {
    const inUrlInitialValues = { columnFilters: urlColumnFilters, globalFilter: urlGlobalFilter, sorting: urlSorting };
    const isFirstRun = previousInitialValues === undefined;
    const isUrlEmpty = !urlGlobalFilter && (!urlSorting || urlSorting.length === 0) && (!urlColumnFilters || urlColumnFilters.length === 0);

    const applyInitialValuesToUrl = () => {
      if (initialValues?.globalFilter) {
        void setUrlGlobalFilter(initialValues.globalFilter);
      }
      if (initialValues?.sorting) {
        void setUrlSorting(initialValues.sorting);
      }
      if (initialValues?.columnFilters) {
        void setUrlColumnFilters(initialValues.columnFilters);
      }
    };

    if (
      !prefix ||
      !initialValues ||
      // Si les props n'ont pas changé, ne pas écraser l'état de l'URL (utilisateur qui interagit avec le tableau)
      JSON.stringify(previousInitialValues) === JSON.stringify(initialValues) ||
      JSON.stringify(inUrlInitialValues) === JSON.stringify(initialValues)
    ) {
      return;
    }

    // Au premier rendu :
    // - si l'URL contient déjà un état, on le garde (priorité à l'URL)
    // - sinon, on initialise l'URL avec les valeurs passées en props
    if (isFirstRun) {
      if (!isUrlEmpty) {
        return;
      }
      applyInitialValuesToUrl();
      return;
    }

    // Après le premier rendu, si les props changent, on les applique à l'URL
    applyInitialValuesToUrl();
  }, [
    previousInitialValues,
    prefix,
    initialValues,
    urlGlobalFilter,
    urlSorting,
    urlColumnFilters,
    setUrlGlobalFilter,
    setUrlSorting,
    setUrlColumnFilters,
  ]);

  const state: TableUrlState = useMemo(
    () => ({
      columnFilters: urlColumnFilters,
      globalFilter: urlGlobalFilter,
      sorting: urlSorting,
    }),
    [urlColumnFilters, urlGlobalFilter, urlSorting]
  );

  const setGlobalFilter = (value: string) => {
    if (prefix) {
      void setUrlGlobalFilter(value || null);
    }
  };

  const setSorting = (value: SortingState | ((prev: SortingState) => SortingState)) => {
    if (prefix) {
      const newValue = typeof value === 'function' ? value(urlSorting) : value;
      void setUrlSorting(newValue.length > 0 ? newValue : null);
    }
  };

  const setColumnFilters = (value: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
    if (prefix) {
      const newValue = typeof value === 'function' ? value(urlColumnFilters) : value;
      void setUrlColumnFilters(newValue.length > 0 ? newValue : null);
    }
  };

  return {
    setColumnFilters,
    setGlobalFilter,
    setSorting,
    state,
  };
};
