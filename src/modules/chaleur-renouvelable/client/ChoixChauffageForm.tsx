import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import Button from '@/components/ui/Button';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { useAddressEligibility } from '@/modules/chaleur-renouvelable/client/hooks/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import { SettingsTopFields } from '@/modules/chaleur-renouvelable/client/SettingsTopFields';
import { getSimulationPrefillFromBatEnrBatiment } from '@/modules/chaleur-renouvelable/simulation-prefill';

export default function ChoixChauffageForm() {
  const router = useRouter();
  const urlParams = useChoixChauffageQueryParams();
  const { geoAddress, setGeoAddress, onSelectGeoAddress, resetEligibility, selectedBatEnrBatiment } = useAddressEligibility(
    urlParams.adresse ?? null
  );
  const isFormDisabled = !urlParams.adresse || !geoAddress || !urlParams.typeLogement || !urlParams.espaceExterieur;

  useEffect(() => {
    if (!selectedBatEnrBatiment) {
      return;
    }

    urlParams.setPrefillParams(getSimulationPrefillFromBatEnrBatiment(selectedBatEnrBatiment));
  }, [selectedBatEnrBatiment, urlParams]);

  return (
    <form>
      <SettingsTopFields
        adresse={urlParams.adresse ?? null}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={(geoAddress?: BANAddressFeature) => {
          if (!geoAddress) {
            resetEligibility();
            return;
          }
          onSelectGeoAddress(geoAddress);
        }}
        typeLogement={urlParams.typeLogement ?? null}
        espaceExterieur={urlParams.espaceExterieur ?? null}
        typeRadiateur={urlParams.typeRadiateur ?? null}
        setSimulationParam={urlParams.setSimulationParam}
      />

      <div className="mt-5 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-end">
        <span className="w-full text-center md:w-auto md:text-left">
          Un <strong>service public</strong> gratuit, fiable et neutre
        </span>
        <Button
          className="w-full md:w-auto md:flex-none md:flex md:justify-center"
          size="medium"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          disabled={isFormDisabled}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            trackPostHogEvent('fcr_landing:hero_cta_clicked');
            trackPostHogEvent('fcr_landing:simulation_started', {
              address_filled: Boolean(urlParams.adresse),
              emitter_type: urlParams.typeRadiateur,
              heating_mode: urlParams.typeLogement,
              outdoor_space: urlParams.espaceExterieur,
            });
            const search = window.location.search;
            router.push(`/chaleur-renouvelable/resultat${search}`);
          }}
        >
          Comparer les solutions
        </Button>
      </div>
    </form>
  );
}
