import { useCallback, useEffect, useState } from 'react';

import { searchBANAddresses } from '@/modules/ban/client';
import type { SuggestionItem } from '@/modules/ban/types';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { fetchJSON, postFetchJSON } from '@/utils/network';

type BatEnrInfo = {
  geothermiePossible: boolean;
  planProtectionAtmosphere: boolean;
};
type EligibilityState = {
  geoAddress?: SuggestionItem;
  batEnr: BatEnrInfo;
  codeDepartement: string;
  temperatureRef: number | null;
};
type RnbExtId = {
  id: string;
  source: string;
  created_at?: string;
  source_version?: string;
};
const emptyState: EligibilityState = {
  batEnr: { geothermiePossible: false, planProtectionAtmosphere: false },
  codeDepartement: '',
  geoAddress: undefined,
  temperatureRef: null,
};

export function useAddressEligibility(adresse: string | null) {
  const trpcUtils = trpc.useUtils();

  const [state, setState] = useState<EligibilityState>(emptyState);

  const resetEligibility = useCallback(() => {
    setState(emptyState);
  }, []);

  const computeEligibilityFromSuggestion = useCallback(
    toastErrors(async (geoAddress: SuggestionItem) => {
      const banId = geoAddress.properties.id;
      const rnb = await fetchJSON(`/api/rnb?banId=${encodeURIComponent(banId)}`);

      const bdnbId = rnb?.results?.[0]?.ext_ids?.find((e: RnbExtId) => e.source === 'bdnb')?.id ?? '';

      const [batEnrDetails, infos] = await Promise.all([
        trpcUtils.client.batEnr.getBatEnrBatimentDetails.query({
          batiment_construction_id: bdnbId,
        }),
        postFetchJSON<LocationInfoResponse>('/api/location-infos', {
          city: geoAddress.properties.city,
          cityCode: geoAddress.properties.citycode,
          onlyCity: true,
        }),
      ]);

      const codeDepartement = infos?.infosVille?.departement_id ?? '';
      const temperatureRef = Number(infos?.infosVille?.temperature_ref_altitude_moyenne);

      setState({
        batEnr: {
          geothermiePossible: Number(batEnrDetails?.gmi_nappe_200) === 1 || Number(batEnrDetails?.gmi_sonde_200) === 1,
          planProtectionAtmosphere: batEnrDetails?.etat_ppa === 'PPA Validés',
        },
        codeDepartement,
        geoAddress,
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
        onlyAddress: true,
        onlyCities: false,
        query: adresseToTest,
      });

      const geoAddress = results?.[0] as SuggestionItem | undefined;
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
    (geoAddress?: SuggestionItem) => {
      if (!geoAddress) return;

      void computeEligibilityFromSuggestion(geoAddress);
    },
    [computeEligibilityFromSuggestion]
  );

  return {
    ...state,
    onSelectGeoAddress,
    resetEligibility,
    setGeoAddress: (geoAddress?: SuggestionItem) => setState((s) => ({ ...s, geoAddress })),
  };
}
