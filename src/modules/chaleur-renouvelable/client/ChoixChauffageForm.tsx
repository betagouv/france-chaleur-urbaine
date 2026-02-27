import { useRouter } from 'next/navigation';

import Button from '@/components/ui/Button';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { SuggestionItem } from '@/modules/ban/types';
import { SettingsTopFields } from '@/modules/chaleur-renouvelable/client/SettingsTopFields';
import { useAddressEligibility } from '@/modules/chaleur-renouvelable/client/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/useChoixChauffageQueryParams';
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
        setAdresse={(v) => void urlParams.setAdresse(v)}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={(geoAddress?: SuggestionItem) => {
          if (!geoAddress) {
            resetEligibility();
            return;
          }
          onSelectGeoAddress(geoAddress);
        }}
        typeLogement={urlParams.typeLogement ?? null}
        setTypeLogement={(v) => void urlParams.setTypeLogement(v)}
        espaceExterieur={(urlParams.espaceExterieur ?? null) as EspaceExterieur | null}
        setEspaceExterieur={(v) => void urlParams.setEspaceExterieur(v)}
      />

      <div className="mt-5 flex justify-end">
        <Button
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
