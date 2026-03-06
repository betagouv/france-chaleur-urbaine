import { useCallback, useEffect, useState } from 'react';

import { searchBANAddresses } from '@/modules/ban/client';
import type { SuggestionItem } from '@/modules/ban/types';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

type BatEnrInfo = {
  geothermiePossible: boolean;
  planProtectionAtmosphere: boolean;
};
type EligibilityState = {
  geoAddress?: SuggestionItem;
  batEnr: BatEnrInfo;
  codeDepartement: string;
  temperatureRef: number | null;
  eligibiliteReseauChaleur: HeatNetwork | null;
};
type RnbExtId = {
  id: string;
  source: string;
  created_at?: string;
  source_version?: string;
};
type TrpcUtils = ReturnType<typeof trpc.useUtils>;

const emptyState: EligibilityState = {
  batEnr: { geothermiePossible: false, planProtectionAtmosphere: false },
  codeDepartement: '',
  eligibiliteReseauChaleur: null,
  geoAddress: undefined,
  temperatureRef: null,
};
const getBatEnrContext = async ({ geoAddress, trpcUtils }: { geoAddress: SuggestionItem; trpcUtils: TrpcUtils }) => {
  const [lon, lat] = geoAddress.geometry.coordinates;
  const banId = geoAddress.properties.id;

  const rnb = await trpcUtils.client.batEnr.getRnbByBanId.query({ banId });
  const bdnbId = rnb?.ext_ids?.find((e: RnbExtId) => e.source === 'bdnb')?.id ?? '';

  const batEnrDetails = bdnbId
    ? await trpcUtils.client.batEnr.getBatEnrBatimentDetails
        .query({
          batiment_construction_id: bdnbId,
        })
        .catch(() => null)
    : null;

  if (batEnrDetails) {
    return {
      batEnrDetails,
      geothermiePossible: null,
    };
  }

  const geothermiePossible = await trpcUtils.client.batEnr.isGeothermiePossible.query({
    lat,
    lon,
  });

  return {
    batEnrDetails: null,
    geothermiePossible,
  };
};

export function useAddressEligibility(adresse: string | null) {
  const trpcUtils = trpc.useUtils();

  const [state, setState] = useState<EligibilityState>(emptyState);

  const resetEligibility = useCallback(() => {
    setState(emptyState);
  }, []);

  const computeEligibilityFromSuggestion = useCallback(
    toastErrors(async (geoAddress: SuggestionItem) => {
      const [lon, lat] = geoAddress.geometry.coordinates;

      const [{ batEnrDetails, geothermiePossible }, infos, eligibility] = await Promise.all([
        getBatEnrContext({ geoAddress, trpcUtils }),
        trpcUtils.client.batEnr.getLocationInfos.query({
          city: geoAddress.properties.city,
          cityCode: geoAddress.properties.citycode,
        }),
        trpcUtils.client.reseaux.eligibilityStatus.query({
          lat,
          lon,
        }),
      ]);

      const codeDepartement = infos?.departement_id ?? '';
      const temperatureRef = Number(infos?.temperature_ref_altitude_moyenne);

      setState({
        batEnr: {
          geothermiePossible: batEnrDetails
            ? Number(batEnrDetails.gmi_nappe_200) === 1 || Number(batEnrDetails.gmi_sonde_200) === 1
            : geothermiePossible,
          planProtectionAtmosphere: batEnrDetails?.etat_ppa === 'PPA Validés',
        },
        codeDepartement,
        eligibiliteReseauChaleur: eligibility,
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
