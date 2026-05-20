import { useCallback, useEffect, useState } from 'react';

import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/types';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';

type BatEnrInfo = {
  architecturalProtectionAc1: boolean;
  architecturalProtectionAc2: boolean;
  architecturalProtectionAc3: boolean;
  architecturalProtectionAc4: boolean;
  architecturalProtectionAc4bis: boolean;
  geothermiePossible: boolean;
  geothermalNappePotential: number | null;
  geothermalNappeGmi: number | null;
  geothermalSondeGmi: number | null;
  hasGeothermalProbeSpace: boolean | null;
  planProtectionAtmosphere: boolean;
};

type EligibilityState = {
  geoAddress?: BANAddressFeature;
  batEnr: BatEnrInfo;
  batEnrBatiments: BatEnrBatiment[];
  codeDepartement: string;
  temperatureRef: number | null;
  eligibiliteReseauChaleur: HeatNetworksResponse | null;
  shouldSelectBatEnrBatiment: boolean;
};

type BatEnrLookupResult = {
  batEnr: BatEnrInfo;
  batEnrBatiments: BatEnrBatiment[];
  shouldSelectBatEnrBatiment: boolean;
};

type TrpcUtils = ReturnType<typeof trpc.useUtils>;

const emptyState: EligibilityState = {
  batEnr: {
    architecturalProtectionAc1: false,
    architecturalProtectionAc2: false,
    architecturalProtectionAc3: false,
    architecturalProtectionAc4: false,
    architecturalProtectionAc4bis: false,
    geothermalNappeGmi: null,
    geothermalNappePotential: null,
    geothermalSondeGmi: null,
    geothermiePossible: false,
    hasGeothermalProbeSpace: null,
    planProtectionAtmosphere: false,
  },
  batEnrBatiments: [],
  codeDepartement: '',
  eligibiliteReseauChaleur: null,
  geoAddress: undefined,
  shouldSelectBatEnrBatiment: false,
  temperatureRef: null,
};

const getBatEnrInfoFromBatiment = (batEnrDetails?: BatEnrBatiment | null): BatEnrInfo => {
  return {
    architecturalProtectionAc1: batEnrDetails?.ac1 ?? false,
    architecturalProtectionAc2: batEnrDetails?.ac2 ?? false,
    architecturalProtectionAc3: batEnrDetails?.ac3 ?? false,
    architecturalProtectionAc4: batEnrDetails?.ac4 ?? false,
    architecturalProtectionAc4bis: batEnrDetails?.ac4bis ?? false,
    geothermalNappeGmi: batEnrDetails?.gmi_nappe_200 != null ? Number(batEnrDetails.gmi_nappe_200) : null,
    geothermalNappePotential: batEnrDetails?.pot_nappe != null ? Number(batEnrDetails.pot_nappe) : null,
    geothermalSondeGmi: batEnrDetails?.gmi_sonde_200 != null ? Number(batEnrDetails.gmi_sonde_200) : null,
    geothermiePossible: [1, 2].includes(Number(batEnrDetails?.gmi_nappe_200)) || [1, 2].includes(Number(batEnrDetails?.gmi_sonde_200)),
    hasGeothermalProbeSpace: batEnrDetails?.place_nappe ?? null,
    planProtectionAtmosphere: batEnrDetails?.etat_ppa === 'PPA Validés',
  };
};

const getBatEnrLookupResult = async ({
  geoAddress,
  trpcUtils,
}: {
  geoAddress: BANAddressFeature;
  trpcUtils: TrpcUtils;
}): Promise<BatEnrLookupResult> => {
  const [lon, lat] = geoAddress.geometry.coordinates;
  const banId = geoAddress.properties.id;
  const batEnrBatiments = await trpcUtils.client.batEnr.getBatEnrBatimentsByBanId.query({ banId }).catch(() => []);

  if (batEnrBatiments.length === 1) {
    return {
      batEnr: getBatEnrInfoFromBatiment(batEnrBatiments[0]),
      batEnrBatiments,
      shouldSelectBatEnrBatiment: false,
    };
  }

  if (batEnrBatiments.length > 1) {
    return {
      batEnr: getBatEnrInfoFromBatiment(null),
      batEnrBatiments,
      shouldSelectBatEnrBatiment: true,
    };
  }

  const batEnrDetails = await trpcUtils.client.batEnr.getBatEnrBatimentDetails.query({ lat, lon }).catch(() => null);

  return {
    batEnr: getBatEnrInfoFromBatiment(batEnrDetails),
    batEnrBatiments: batEnrDetails ? [batEnrDetails] : [],
    shouldSelectBatEnrBatiment: false,
  };
};

export function useAddressEligibility(adresse: string | null) {
  const trpcUtils = trpc.useUtils();
  const [state, setState] = useState<EligibilityState>(emptyState);

  const resetEligibility = useCallback(() => {
    setState(emptyState);
  }, []);

  const computeEligibilityFromSuggestion = useCallback(
    toastErrors(async (geoAddress: BANAddressFeature) => {
      const [lon, lat] = geoAddress.geometry.coordinates;
      const { city, citycode } = geoAddress.properties;

      const [batEnrLookup, infos, eligibiliteReseauChaleur] = await Promise.all([
        getBatEnrLookupResult({ geoAddress, trpcUtils }),
        trpcUtils.client.batEnr.getLocationInfos.query({
          city,
          cityCode: citycode,
        }),
        trpcUtils.client.reseaux.eligibilityStatus.query({
          lat,
          lon,
        }),
      ]);

      setState({
        batEnr: batEnrLookup.batEnr,
        batEnrBatiments: batEnrLookup.batEnrBatiments,
        codeDepartement: infos?.departement_id ?? '',
        eligibiliteReseauChaleur,
        geoAddress,
        shouldSelectBatEnrBatiment: batEnrLookup.shouldSelectBatEnrBatiment,
        temperatureRef: infos?.temperature_ref_altitude_moyenne != null ? Number(infos.temperature_ref_altitude_moyenne) : null,
      });
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
    if (!adresse) return;
    void triggerEligibilityFromString(adresse);
  }, [adresse, triggerEligibilityFromString]);

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
      shouldSelectBatEnrBatiment: false,
    }));
  }, []);

  return {
    ...state,
    onSelectGeoAddress,
    resetEligibility,
    selectBatEnrBatiment,
    setGeoAddress,
  };
}
