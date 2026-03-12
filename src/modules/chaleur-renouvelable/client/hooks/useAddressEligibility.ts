import { useCallback, useEffect, useState } from 'react';

import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

type BatEnrInfo = {
  geothermiePossible: boolean;
  planProtectionAtmosphere: boolean;
};

type EligibilityState = {
  geoAddress?: BANAddressFeature;
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
  batEnr: {
    geothermiePossible: false,
    planProtectionAtmosphere: false,
  },
  codeDepartement: '',
  eligibiliteReseauChaleur: null,
  geoAddress: undefined,
  temperatureRef: null,
};

const getBatEnrInfo = async ({ geoAddress, trpcUtils }: { geoAddress: BANAddressFeature; trpcUtils: TrpcUtils }): Promise<BatEnrInfo> => {
  const [lon, lat] = geoAddress.geometry.coordinates;
  const banId = geoAddress.properties.id;
  const rnb = await trpcUtils.client.batEnr.getRnbByBanId.query({ banId });
  const bdnbId = rnb?.ext_ids?.find((e: RnbExtId) => e.source === 'bdnb')?.id;

  let batEnrDetails = bdnbId
    ? await trpcUtils.client.batEnr.getBatEnrBatimentDetails.query({ batiment_construction_id: bdnbId }).catch(() => null)
    : null;

  if (!batEnrDetails) {
    // Si l'appel au rnb ou à batenr est infructueux, on prend le bâtiment le plus proche
    batEnrDetails = await trpcUtils.client.batEnr.getBatEnrBatimentDetails.query({ lat, lon }).catch(() => null);
  }

  return {
    geothermiePossible: Number(batEnrDetails?.gmi_nappe_200) === 1 || Number(batEnrDetails?.gmi_sonde_200) === 1,
    planProtectionAtmosphere: batEnrDetails?.etat_ppa === 'PPA Validés',
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

      const [batEnr, infos, eligibiliteReseauChaleur] = await Promise.all([
        getBatEnrInfo({ geoAddress, trpcUtils }),
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
        batEnr,
        codeDepartement: infos?.departement_id ?? '',
        eligibiliteReseauChaleur,
        geoAddress,
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

  return {
    ...state,
    onSelectGeoAddress,
    resetEligibility,
    setGeoAddress,
  };
}
