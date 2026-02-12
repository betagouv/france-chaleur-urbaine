import { useRouter } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';

import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import AddressAutocompleteInput from '@/components/form/dsfr/AddressAutocompleteInput';
import Select from '@/components/form/dsfr/Select';
import Button from '@/components/ui/Button';
import RichSelect from '@/components/ui/RichSelect';
import type { EspaceExterieur } from '@/modules/app/types';
import type { SuggestionItem } from '@/modules/ban/types';

const espaceExterieurValues = ['shared', 'private', 'both', 'none'] as const satisfies readonly EspaceExterieur[];

export default function ChoixChauffageForm() {
  const router = useRouter();
  const [adresse, setAdresse] = useQueryState('adresse');
  const [typeLogement, setTypeLogement] = useQueryState(
    'typeLogement',
    parseAsStringLiteral([
      'immeuble_chauffage_collectif',
      'immeuble_chauffage_individuel',
      'maison_individuelle',
    ] as const satisfies readonly TypeLogement[])
  );
  const [espaceExterieur, setEspaceExterieur] = useQueryState('espaceExterieur', parseAsStringLiteral(espaceExterieurValues));

  const [loadingStatus, setLoadingStatus] = useState<'idle' | 'loading'>('idle');
  const [geoAddress, setGeoAddress] = useState<SuggestionItem | undefined>();

  const outdoorOptions = useMemo(
    (): { value: EspaceExterieur; label: string; description?: string }[] => [
      { description: 'Cour, jardin, toit terrasse…', label: 'Espaces partagés uniquement', value: 'shared' },
      { description: 'Balcons, terrasses…', label: 'Espaces individuels uniquement', value: 'private' },
      { description: 'Cour, jardin, toit terrasse, balcons…', label: 'Espaces partagés et individuels', value: 'both' },
      { label: 'Aucun espace extérieur', value: 'none' },
    ],
    []
  );

  const isDisabled = !adresse || !geoAddress || !typeLogement || !espaceExterieur || loadingStatus === 'loading';

  return (
    <form>
      <div className="fr-p-3w grid grid-cols-1 gap-4 md:grid-cols-3 bg-[#fbf6ed]">
        <AddressAutocompleteInput
          className="fr-mb-0"
          defaultValue={adresse ?? undefined}
          nativeInputProps={{ placeholder: 'Tapez votre adresse ici' }}
          onClear={() => {
            void setAdresse(null);
            setGeoAddress(undefined);
          }}
          onSelect={(geoAddress?: SuggestionItem) => {
            void setAdresse(geoAddress?.properties?.label ?? '');
            setGeoAddress(geoAddress);
          }}
          onError={() => setLoadingStatus('idle')}
        />
        <Select
          label="Mode de chauffage"
          className="fr-mb-0"
          options={[
            { label: 'Immeuble en chauffage collectif', value: 'immeuble_chauffage_collectif' satisfies TypeLogement },
            { label: 'Immeuble en chauffage individuel', value: 'immeuble_chauffage_individuel' satisfies TypeLogement },
            { label: 'Maison individuelle', value: 'maison_individuelle' satisfies TypeLogement },
          ]}
          nativeSelectProps={{
            onChange: (e) => void setTypeLogement(e.target.value as TypeLogement),
            value: typeLogement ?? undefined,
          }}
        />
        <RichSelect<EspaceExterieur>
          value={espaceExterieur ?? undefined}
          onChange={(val) => void setEspaceExterieur(val)}
          options={outdoorOptions}
          placeholder="Sélectionner vos espaces disponibles"
          label="Espaces extérieurs"
        />
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          size="medium"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          // eventKey=""
          loading={loadingStatus === 'loading'}
          disabled={isDisabled}
          onClick={(e) => {
            e.preventDefault();
            setLoadingStatus('loading');

            const search = window.location.search;
            router.push(`/chaleur-renouvelable/resultat${search}`);

            setLoadingStatus('idle');
          }}
        >
          Comparer les solutions
        </Button>
      </div>
    </form>
  );
}
