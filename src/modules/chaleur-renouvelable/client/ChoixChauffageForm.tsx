import { useRouter } from 'next/navigation';

import Button from '@/components/ui/Button';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { useAddressEligibility } from '@/modules/chaleur-renouvelable/client/hooks/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import { SettingsTopFields } from '@/modules/chaleur-renouvelable/client/SettingsTopFields';
import type { EspaceExterieur } from '@/modules/chaleur-renouvelable/constants';

export default function ChoixChauffageForm() {
  const router = useRouter();
  const urlParams = useChoixChauffageQueryParams();
  const { geoAddress, setGeoAddress, onSelectGeoAddress, resetEligibility } = useAddressEligibility(urlParams.adresse ?? null);
  const isFormDisabled = !urlParams.adresse || !geoAddress || !urlParams.typeLogement || !urlParams.espaceExterieur;

  return (
    <form>
      <SettingsTopFields
        withLabel
        className="fr-p-3w grid grid-cols-1 gap-4 md:grid-cols-3 bg-[#fbf6ed]"
        adresse={urlParams.adresse ?? null}
        setAdresse={urlParams.setAdresse}
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
        setTypeLogement={urlParams.setTypeLogement}
        espaceExterieur={(urlParams.espaceExterieur ?? null) as EspaceExterieur | null}
        setEspaceExterieur={urlParams.setEspaceExterieur}
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
          onClick={(e) => {
            e.stopPropagation();
            trackPostHogEvent('chaleur-renouvelable:form_submit', {
              address: String(urlParams.adresse),
              espaceExterieur: String(urlParams.espaceExterieur),
              typeLogement: String(urlParams.typeLogement),
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
