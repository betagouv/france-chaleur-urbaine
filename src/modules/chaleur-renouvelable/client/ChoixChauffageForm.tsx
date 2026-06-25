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
  const chauffageQuery = useChoixChauffageQueryParams();
  const params = chauffageQuery.params;
  const { geoAddress, setGeoAddress, onSelectGeoAddress, resetEligibility, selectedBatEnrBatiment } = useAddressEligibility(
    params.adresse ?? null
  );
  const isFormDisabled = !params.adresse || !geoAddress || !params.typeLogement || !params.espaceExterieur;

  useEffect(() => {
    if (!selectedBatEnrBatiment) {
      return;
    }

    chauffageQuery.setPrefillParams(getSimulationPrefillFromBatEnrBatiment(selectedBatEnrBatiment));
  }, [chauffageQuery, selectedBatEnrBatiment]);

  return (
    <form>
      <SettingsTopFields
        adresse={params.adresse ?? null}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={(geoAddress?: BANAddressFeature) => {
          if (!geoAddress) {
            resetEligibility();
            return;
          }
          onSelectGeoAddress(geoAddress);
        }}
        typeLogement={params.typeLogement ?? null}
        espaceExterieur={params.espaceExterieur ?? null}
        typeRadiateur={params.typeRadiateur ?? null}
        setParams={chauffageQuery.setParams}
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
              address_filled: Boolean(params.adresse),
              emitter_type: params.typeRadiateur,
              heating_mode: params.typeLogement,
              outdoor_space: params.espaceExterieur,
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
