import { useCallback, useEffect, useRef, useState } from 'react';

import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { type BatEnrInfo, EMPTY_BAT_ENR_INFO, getBatEnrInfoFromBatiment } from '@/modules/chaleur-renouvelable/bat-enr';
import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/constants';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

type EligibilityState = {
  geoAddress?: BANAddressFeature;
  batEnr: BatEnrInfo;
  batEnrBatiments: BatEnrBatiment[];
  selectedBatEnrBatiment?: BatEnrBatiment;
  codeDepartement: string;
  temperatureRef: number | null;
  eligibiliteReseauChaleur: HeatNetwork | null;
  shouldSelectBatEnrBatiment: boolean;
};

const emptyState: EligibilityState = {
  batEnr: EMPTY_BAT_ENR_INFO,
  batEnrBatiments: [],
  codeDepartement: '',
  eligibiliteReseauChaleur: null,
  geoAddress: undefined,
  selectedBatEnrBatiment: undefined,
  shouldSelectBatEnrBatiment: false,
  temperatureRef: null,
};

export function useAddressEligibility(adresse: string | null, selectedBatimentConstructionId?: string | null) {
  const trpcUtils = trpc.useUtils();
  const [state, setState] = useState<EligibilityState>(emptyState);
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(false);
  const selectedBatimentConstructionIdRef = useRef(selectedBatimentConstructionId);

  useEffect(() => {
    selectedBatimentConstructionIdRef.current = selectedBatimentConstructionId;
  }, [selectedBatimentConstructionId]);

  const resetEligibility = useCallback(() => {
    setState(emptyState);
  }, []);

  const computeEligibilityFromSuggestion = useCallback(
    toastErrors(async (geoAddress: BANAddressFeature) => {
      setIsEligibilityLoading(true);

      try {
        const [lon, lat] = geoAddress.geometry.coordinates;
        const { city, citycode } = geoAddress.properties;

        const addressEligibilityContext = await trpcUtils.client.batEnr.getAddressEligibilityContext.query({
          banId: geoAddress.properties.id,
          city,
          cityCode: citycode,
          lat,
          lon,
          selectedBatimentConstructionId: selectedBatimentConstructionIdRef.current,
        });

        setState({
          batEnr: addressEligibilityContext.batEnr,
          batEnrBatiments: addressEligibilityContext.batEnrBatiments,
          codeDepartement: addressEligibilityContext.codeDepartement,
          eligibiliteReseauChaleur: addressEligibilityContext.eligibiliteReseauChaleur,
          geoAddress,
          selectedBatEnrBatiment: addressEligibilityContext.selectedBatEnrBatiment,
          shouldSelectBatEnrBatiment: addressEligibilityContext.shouldSelectBatEnrBatiment,
          temperatureRef: addressEligibilityContext.temperatureRef,
        });
      } finally {
        setIsEligibilityLoading(false);
      }
    }),
    [trpcUtils]
  );

  const triggerEligibilityFromString = useCallback(
    toastErrors(async (adresseToTest: string) => {
      if (!adresseToTest) return;

      const geoAddress = (
        await searchBANAddresses({
          excludeCities: true,
          limit: 1,
          onlyAddress: true,
          onlyCities: false,
          query: adresseToTest,
        })
      )?.[0] as BANAddressFeature | undefined;

      if (!geoAddress) {
        resetEligibility();
        return;
      }

      await computeEligibilityFromSuggestion(geoAddress);
    }),
    [computeEligibilityFromSuggestion, resetEligibility]
  );

  useEffect(() => {
    if (!adresse) {
      resetEligibility();
      return;
    }

    void triggerEligibilityFromString(adresse);
  }, [adresse, resetEligibility, triggerEligibilityFromString]);

  const onSelectGeoAddress = useCallback(
    (geoAddress?: BANAddressFeature) => {
      if (!geoAddress) return;
      void computeEligibilityFromSuggestion(geoAddress);
    },
    [computeEligibilityFromSuggestion]
  );

  const setGeoAddress = useCallback((geoAddress?: BANAddressFeature) => {
    setState((current) => ({ ...current, geoAddress }));
  }, []);

  const selectBatEnrBatiment = useCallback((batEnrBatiment: BatEnrBatiment) => {
    setState((current) => ({
      ...current,
      batEnr: getBatEnrInfoFromBatiment(batEnrBatiment),
      selectedBatEnrBatiment: batEnrBatiment,
      shouldSelectBatEnrBatiment: false,
    }));
  }, []);

  return {
    ...state,
    isEligibilityLoading,
    onSelectGeoAddress,
    resetEligibility,
    selectBatEnrBatiment,
    setGeoAddress,
  };
}
