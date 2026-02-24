import { useRouter } from 'next/navigation';

import { SettingsTopFields } from '@/components/choix-chauffage/SettingsTopFields';
import { useAddressEligibility } from '@/components/choix-chauffage/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/components/choix-chauffage/useChoixChauffageQueryParams';
import Button from '@/components/ui/Button';
import type { EspaceExterieur } from '@/modules/app/types';
import type { SuggestionItem } from '@/modules/ban/types';

export default function ChoixChauffageForm() {
  const router = useRouter();
  const urlParams = useChoixChauffageQueryParams();
  const { geoAddress, setGeoAddress, onSelectGeoAddress, resetEligibility } = useAddressEligibility(urlParams.adresse ?? null);
  const isDisabled = !urlParams.adresse || !geoAddress || !urlParams.typeLogement || !urlParams.espaceExterieur;

  return (
    <form>
      <SettingsTopFields
        withLabel
        className="fr-p-3w grid grid-cols-1 gap-4 md:grid-cols-3 bg-[#fbf6ed]"
        adresse={urlParams.adresse ?? null}
        setAdresse={(v) => void urlParams.setAdresse(v)}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={(ga?: SuggestionItem) => {
          if (!ga) {
            resetEligibility();
            return;
          }
          onSelectGeoAddress(ga);
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
          disabled={isDisabled}
          onClick={(e) => {
            e.preventDefault();
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
