import { useRouter } from 'next/navigation';

import { SettingsTopFields } from '@/components/choix-chauffage/SettingsTopFields';
import { useAddressEligibility } from '@/components/choix-chauffage/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/components/choix-chauffage/useChoixChauffageQueryParams';
import Button from '@/components/ui/Button';
import type { EspaceExterieur } from '@/modules/app/types';
import type { SuggestionItem } from '@/modules/ban/types';

export default function ChoixChauffageForm() {
  const router = useRouter();
  const qp = useChoixChauffageQueryParams();
  const { geoAddress, setGeoAddress, onSelectGeoAddress, resetEligibility } = useAddressEligibility(qp.adresse ?? null);
  const isDisabled = !qp.adresse || !geoAddress || !qp.typeLogement || !qp.espaceExterieur;

  return (
    <form>
      <SettingsTopFields
        withLabel
        className="fr-p-3w grid grid-cols-1 gap-4 md:grid-cols-3 bg-[#fbf6ed]"
        adresse={qp.adresse ?? null}
        setAdresse={(v) => void qp.setAdresse(v)}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={(ga?: SuggestionItem) => {
          if (!ga) {
            resetEligibility();
            return;
          }
          onSelectGeoAddress(ga);
        }}
        typeLogement={qp.typeLogement ?? null}
        setTypeLogement={(v) => void qp.setTypeLogement(v)}
        espaceExterieur={(qp.espaceExterieur ?? null) as EspaceExterieur | null}
        setEspaceExterieur={(v) => void qp.setEspaceExterieur(v)}
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
