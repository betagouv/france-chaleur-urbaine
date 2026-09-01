import { useCallback, useEffect, useState } from 'react';

import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { type BatEnrInfo, EMPTY_BAT_ENR_INFO, getBatEnrInfoFromBatiment } from '@/modules/chaleur-renouvelable/bat-enr';
import type { BatEnrBatiment, ColdNetworkEligibility } from '@/modules/chaleur-renouvelable/constants';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

type EligibilityState = {
  geoAddress?: BANAddressFeature;
  altitude: number | null;
  batEnr: BatEnrInfo;
  batEnrBatiments: BatEnrBatiment[];
  selectedBatEnrBatiment?: BatEnrBatiment;
  codeDepartement: string;
  temperatureRef: number | null;
  eligibiliteReseauChaleur: HeatNetwork | null;
  eligibiliteReseauFroid: ColdNetworkEligibility | null;
  shouldSelectBatEnrBatiment: boolean;
};

const emptyState: EligibilityState = {
  altitude: null,
  batEnr: EMPTY_BAT_ENR_INFO,
  batEnrBatiments: [],
  codeDepartement: '',
  eligibiliteReseauChaleur: null,
  eligibiliteReseauFroid: null,
  geoAddress: undefined,
  selectedBatEnrBatiment: undefined,
  shouldSelectBatEnrBatiment: false,
  temperatureRef: null,
};

export function getBANAddressFeatureByLabel(features: BANAddressFeature[], addressLabel: string) {
  return features.find((feature) => feature.properties.type === 'housenumber' && feature.properties.label === addressLabel);
}

export function useAddressEligibility(
  adresse: string | null,
  selectedBatimentConstructionId?: string | null,
  onAddressNotFound?: () => void
) {
  const trpcUtils = trpc.useUtils();
  const [state, setState] = useState<EligibilityState>(emptyState);
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(false);

  const resetEligibility = useCallback(() => {
    setState(emptyState);
  }, []);

  const computeEligibilityFromSuggestion = useCallback(
    toastErrors(async (geoAddress: BANAddressFeature, batimentConstructionId?: string | null) => {
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
          selectedBatimentConstructionId: batimentConstructionId ?? null,
        });

        logAddressEligibilityContext(addressEligibilityContext);

        setState({
          altitude: addressEligibilityContext.altitude,
          batEnr: addressEligibilityContext.batEnr,
          batEnrBatiments: addressEligibilityContext.batEnrBatiments,
          codeDepartement: addressEligibilityContext.codeDepartement,
          eligibiliteReseauChaleur: addressEligibilityContext.eligibiliteReseauChaleur,
          eligibiliteReseauFroid: addressEligibilityContext.eligibiliteReseauFroid,
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
    toastErrors(async (adresseToTest: string, batimentConstructionId?: string | null) => {
      if (!adresseToTest) {
        return;
      }

      const features = await searchBANAddresses({
        excludeCities: true,
        onlyAddress: true,
        onlyCities: false,
        query: adresseToTest,
      });
      const geoAddress = getBANAddressFeatureByLabel(features, adresseToTest);

      if (!geoAddress) {
        resetEligibility();
        onAddressNotFound?.();
        return;
      }

      await computeEligibilityFromSuggestion(geoAddress, batimentConstructionId);
    }),
    [computeEligibilityFromSuggestion, onAddressNotFound, resetEligibility]
  );

  useEffect(() => {
    if (!adresse) {
      resetEligibility();
      return;
    }

    void triggerEligibilityFromString(adresse, selectedBatimentConstructionId);
  }, [adresse, resetEligibility, selectedBatimentConstructionId, triggerEligibilityFromString]);

  const onSelectGeoAddress = useCallback(
    (geoAddress?: BANAddressFeature) => {
      if (!geoAddress) {
        return;
      }

      void computeEligibilityFromSuggestion(geoAddress, null);
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

const logAddressEligibilityContext = (
  addressEligibilityContext: Pick<EligibilityState, 'altitude' | 'batEnr' | 'eligibiliteReseauChaleur' | 'eligibiliteReseauFroid'>
) => {
  console.groupCollapsed(
    '%c/chaleur-renouvelable%c getAddressEligibilityContext',
    'color: #000091; font-weight: 700;',
    'color: #666; font-weight: 400;'
  );
  console.log({
    altitude: addressEligibilityContext.altitude,
    batEnr: addressEligibilityContext.batEnr,
    eligibiliteReseauChaleur: addressEligibilityContext.eligibiliteReseauChaleur,
    eligibiliteReseauFroid: addressEligibilityContext.eligibiliteReseauFroid,
  });
  console.groupEnd();
};
