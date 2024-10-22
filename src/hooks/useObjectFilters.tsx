import { parseAsJson, useQueryState } from 'nuqs';

import { deepMergeObjects, getProperty, setProperty } from '@utils/core';
import { deepIntersection } from '@utils/objects';
import { FlattenKeys } from '@utils/typescript';

const countNotArrayLeaves = <T extends Record<string, any>>(obj: T): number =>
  obj && typeof obj === 'object' && !Array.isArray(obj) ? Object.values(obj).reduce((acc, v) => acc + countNotArrayLeaves(v), 0) : 1;

const useObjectFilters = <T extends Record<string, any>>(originalData: T) => {
  const [filtersOrNull, setFilters] = useQueryState('object_filtering', parseAsJson<Partial<T>>().withDefault({} as Partial<T>));
  const filters = filtersOrNull ?? ({} as Partial<T>);

  const updateFilter = (property: string, value?: any) => {
    setProperty(filters, property as FlattenKeys<Partial<T>>, value);
    updateFilters(filters);
  };

  const updateFilters = (updatedFilters: Partial<T>) => {
    const fullFilters = deepMergeObjects(filters, updatedFilters);
    const changedFilters = deepIntersection(originalData, fullFilters, { keepArray: true });

    setFilters(changedFilters);
  };

  const countFilters = (startKey?: FlattenKeys<T>) => {
    return countNotArrayLeaves(startKey ? getProperty(filters, startKey) : filters);
  };

  const resetFilters = () => setFilters(null);

  return {
    data: deepMergeObjects(originalData, filters),
    resetFilters,
    updateFilter,
    nbFilters: countFilters(),
    countFilters,
  };
};

export default useObjectFilters;
