import { useSearchParams } from 'next/navigation';
import { parseAsJson, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

import { type ReseauxDeChaleurLimits } from '@/components/Map/layers/filters';
import { defaultInterval, percentageMaxInterval, type FiltreEnergieConfKey } from '@/components/Map/map-configuration';
import { deepMergeObjects, getProperty, setProperty } from '@/utils/core';
import { fetchJSON } from '@/utils/network';
import { deepIntersection } from '@/utils/objects';
import { type FlattenKeys } from '@/utils/typescript';

const countNotArrayLeaves = <T extends Record<string, any>>(obj: T = {} as T): number =>
  obj && typeof obj === 'object' && !Array.isArray(obj) ? Object.values(obj).reduce((acc, v) => acc + countNotArrayLeaves(v), 0) : 1;

export const emptyFilterLimits = {
  reseauxDeChaleur: {
    energieMobilisee: [] as FiltreEnergieConfKey[],
    energie_ratio_biomasse: percentageMaxInterval,
    energie_ratio_geothermie: percentageMaxInterval,
    energie_ratio_uve: percentageMaxInterval,
    energie_ratio_chaleurIndustrielle: percentageMaxInterval,
    energie_ratio_solaireThermique: percentageMaxInterval,
    energie_ratio_pompeAChaleur: percentageMaxInterval,
    energie_ratio_gaz: percentageMaxInterval,
    energie_ratio_fioul: percentageMaxInterval,
    tauxENRR: percentageMaxInterval,
    emissionsCO2: defaultInterval,
    contenuCO2: defaultInterval,
    prixMoyen: defaultInterval,
    livraisonsAnnuelles: defaultInterval,
    anneeConstruction: defaultInterval,
    gestionnaires: [] as string[],
    isClassed: false,
    regions: [] as string[],
  },
};

export type Filters = typeof emptyFilterLimits;
export type FilterKeys = FlattenKeys<Filters>;

const useReseauxDeChaleurFilters = ({ queryParamName = 'rdc_filters' }: { queryParamName?: string } = {}) => {
  const [filtersOrNull, setFilters] = useQueryState(queryParamName, parseAsJson<Partial<Filters>>().withDefault({} as Filters));
  const filters = filtersOrNull ?? ({} as Filters);
  const [limits, setLimits] = useState(emptyFilterLimits);
  const searchParams = useSearchParams();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) {
      return;
    }
    (async () => {
      try {
        const specialLimits = await fetchJSON<ReseauxDeChaleurLimits>('/api/map/network-limits');

        setLimits({
          ...limits,
          reseauxDeChaleur: {
            ...limits.reseauxDeChaleur,
            ...specialLimits,
          },
        });
        setLoaded(true);
      } finally {
        setTimeout(() => {
          setLoaded(true);
        });
      }
    })();
  }, [limits]);

  const updateFilter = (property: FilterKeys, value?: any) => {
    const updatedFilters = { ...filters };
    setProperty(updatedFilters, property as keyof typeof filters, value);
    updateFilters(updatedFilters as Filters);
  };

  const updateFilters = (updatedFilters: Filters) => {
    const fullFilters = deepMergeObjects(filters, updatedFilters);
    const changedFilters = deepIntersection(limits, fullFilters, { keepArray: true });

    setFilters(Object.keys(changedFilters).length === 0 ? null : changedFilters);
  };

  const countFilters = (startKey?: keyof Filters) => {
    return countNotArrayLeaves(startKey ? getProperty(filters, startKey) : filters);
  };

  const resetFilters = () => setFilters(null);

  return {
    limits,
    filters,
    resetFilters,
    updateFilter,
    nbFilters: countFilters(),
    loading: !loaded,
    countFilters,
    filtersQueryParam: searchParams.get(queryParamName),
  };
};

export default useReseauxDeChaleurFilters;
