import { useSearchParams } from 'next/navigation';
import { parseAsJson, useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';

import type { ReseauxDeChaleurLimits } from '@/components/Map/layers/filters';
import { defaultInterval, type FiltreEnergieConfKey, percentageMaxInterval } from '@/components/Map/map-configuration';
import { deepMergeObjects, setProperty } from '@/utils/core';
import { fetchJSON } from '@/utils/network';
import { deepIntersection } from '@/utils/objects';
import type { FlattenKeys } from '@/utils/typescript';

export const emptyFilterLimits = {
  anneeConstruction: defaultInterval,
  contenuCO2: defaultInterval,
  emissionsCO2: defaultInterval,
  energie_ratio_biomasse: percentageMaxInterval,
  energie_ratio_chaleurIndustrielle: percentageMaxInterval,
  energie_ratio_fioul: percentageMaxInterval,
  energie_ratio_gaz: percentageMaxInterval,
  energie_ratio_geothermie: percentageMaxInterval,
  energie_ratio_pompeAChaleur: percentageMaxInterval,
  energie_ratio_solaireThermique: percentageMaxInterval,
  energie_ratio_uve: percentageMaxInterval,
  energieMobilisee: [] as FiltreEnergieConfKey[],
  gestionnaires: [] as string[],
  isClassed: false,
  livraisonsAnnuelles: defaultInterval,
  prixMoyen: defaultInterval,
  regions: [] as string[],
  tauxENRR: percentageMaxInterval,
};

export type Filters = typeof emptyFilterLimits;
export type FilterKeys = FlattenKeys<Filters>;

export type FilterWithLimits = Filters & { limits: ReseauxDeChaleurLimits };

const useReseauxDeChaleurFilters = ({ queryParamName = 'rdc_filters' }: { queryParamName?: string } = {}) => {
  const [urlFilters, setUrlFilters] = useQueryState(
    queryParamName,
    parseAsJson<Partial<Filters>>((value) => value as Partial<Filters>).withDefault({} as Filters)
  );
  const [defaultFilters, setDefaultFilters] = useState<FilterWithLimits>({ ...emptyFilterLimits, limits: {} as ReseauxDeChaleurLimits }); // pas génial, mais un refacto s'imposera pour avoir un typage correct
  const searchParams = useSearchParams();
  const [loaded, setLoaded] = useState(false);

  const filters: FilterWithLimits = useMemo(
    () => deepMergeObjects(defaultFilters, urlFilters),
    [defaultFilters, JSON.stringify(urlFilters)]
  );

  useEffect(() => {
    if (loaded) {
      return;
    }
    void (async () => {
      try {
        const networkLimits = await fetchJSON<ReseauxDeChaleurLimits>('/api/map/network-limits');

        setDefaultFilters({
          ...defaultFilters,
          ...networkLimits,
          limits: networkLimits,
        });
        setLoaded(true);
      } finally {
        setTimeout(() => {
          setLoaded(true);
        });
      }
    })();
  }, [defaultFilters]);

  const updateFilter = (property: FilterKeys, value?: any) => {
    const updatedFilters = { ...urlFilters };
    setProperty(updatedFilters, property as keyof typeof urlFilters, value);
    updateFilters(updatedFilters as Filters);
  };

  const updateFilters = (updatedFilters: Filters) => {
    const fullFilters = deepMergeObjects(urlFilters, updatedFilters);
    const changedFilters = deepIntersection(defaultFilters, fullFilters, { keepArray: true });

    void setUrlFilters(Object.keys(changedFilters).length === 0 ? null : changedFilters);
  };

  const resetFilters = () => setUrlFilters(null);

  return {
    filters,
    filtersQueryParam: searchParams.get(queryParamName),
    limits: defaultFilters,
    loading: !loaded,
    nbFilters: Object.keys(urlFilters).length,
    resetFilters,
    updateFilter,
  };
};

export default useReseauxDeChaleurFilters;
