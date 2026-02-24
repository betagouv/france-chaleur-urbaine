import { useCallback, useEffect, useState } from 'react';

import { searchBANAddresses } from '@/modules/ban/client';
import type { SuggestionItem } from '@/modules/ban/types';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import type { AddressDetail } from '@/types/HeatNetworksResponse';
import { postFetchJSON } from '@/utils/network';

type EligibilityState = {
  geoAddress?: SuggestionItem;
  addressDetail: AddressDetail | null;
  codeDepartement: string;
  temperatureRef: number | null;
};

const EMPTY: EligibilityState = {
  addressDetail: null,
  codeDepartement: '',
  geoAddress: undefined,
  temperatureRef: null,
};

export function useAddressEligibility(adresse: string | null) {
  const trpcUtils = trpc.useUtils();

  const [state, setState] = useState<EligibilityState>(EMPTY);

  const resetEligibility = useCallback(() => {
    setState(EMPTY);
  }, []);

  const computeEligibilityFromSuggestion = useCallback(
    toastErrors(async (found: SuggestionItem) => {
      const [lon, lat] = found.geometry.coordinates;
      const point = { lat, lon };

      const [eligibilityStatus, batEnrDetails, infos] = await Promise.all([
        trpcUtils.client.reseaux.eligibilityStatus.query(point),
        trpcUtils.client.batEnr.getBatEnrBatimentDetails.query(point),
        postFetchJSON<LocationInfoResponse>('/api/location-infos', {
          city: found.properties.city,
          cityCode: found.properties.citycode,
          lat,
          lon,
          onlyCity: true,
        }),
      ]);

      const codeDepartement = infos?.infosVille?.departement_id ?? '';
      const temperatureRef = Number(infos?.infosVille?.temperature_ref_altitude_moyenne);
      const addressDetail: AddressDetail = {
        batEnr: {
          gmi: Number(batEnrDetails?.gmi_nappe_200) === 1 || Number(batEnrDetails?.gmi_sonde_200) === 1,
          ppa: batEnrDetails?.etat_ppa === 'PPA Validés',
        },
        geoAddress: found,
        network: eligibilityStatus,
      };

      setState({
        addressDetail,
        codeDepartement,
        geoAddress: found,
        temperatureRef,
      });
    }),
    [trpcUtils]
  );

  const triggerEligibilityFromString = useCallback(
    toastErrors(async (adresseToTest: string) => {
      if (!adresseToTest) return;

      const results = await searchBANAddresses({
        excludeCities: true,
        limit: 1,
        onlyCities: false,
        query: adresseToTest,
      });

      const found = results?.[0] as SuggestionItem | undefined;
      if (!found) {
        resetEligibility();
        return;
      }

      await computeEligibilityFromSuggestion(found);
    }),
    [computeEligibilityFromSuggestion, resetEligibility]
  );

  useEffect(() => {
    if (!adresse) return;
    void triggerEligibilityFromString(adresse);
  }, [adresse, triggerEligibilityFromString]);

  const onSelectGeoAddress = useCallback(
    (found?: SuggestionItem) => {
      if (!found) return;

      void computeEligibilityFromSuggestion(found);
    },
    [computeEligibilityFromSuggestion]
  );

  return {
    ...state,
    onSelectGeoAddress,
    resetEligibility,
    setGeoAddress: (geoAddress?: SuggestionItem) => setState((s) => ({ ...s, geoAddress })),
    triggerEligibilityFromString,
  };
}
