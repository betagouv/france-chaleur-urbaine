import { useSearchParams } from 'next/navigation';
import { parseAsJson, useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';

import { type ReseauxDeChaleurLimits } from '@/components/Map/layers/filters';
import { defaultInterval, percentageMaxInterval, type FiltreEnergieConfKey } from '@/components/Map/map-configuration';
import { deepMergeObjects, setProperty } from '@/utils/core';
import { fetchJSON } from '@/utils/network';
import { deepIntersection } from '@/utils/objects';
import { type FlattenKeys } from '@/utils/typescript';

export const emptyFilterLimits = {
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
};

export type Filters = typeof emptyFilterLimits;
export type FilterKeys = FlattenKeys<Filters>;

type FilterWithLimits = Filters & { limits: ReseauxDeChaleurLimits };

const useReseauxDeChaleurFilters = ({ queryParamName = 'rdc_filters' }: { queryParamName?: string } = {}) => {
  const [urlFilters, setUrlFilters] = useQueryState(queryParamName, parseAsJson<Partial<Filters>>().withDefault({} as Filters));
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
    (async () => {
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

    setUrlFilters(Object.keys(changedFilters).length === 0 ? null : changedFilters);
  };

  const resetFilters = () => setUrlFilters(null);

  return {
    limits: defaultFilters,
    filters,
    resetFilters,
    updateFilter,
    nbFilters: Object.keys(urlFilters).length,
    loading: !loaded,
    filtersQueryParam: searchParams.get(queryParamName),
  };
};

export default useReseauxDeChaleurFilters;
