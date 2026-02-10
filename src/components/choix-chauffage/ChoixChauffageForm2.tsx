// components/choix-chauffage/ChoixChauffageForm2.tsx
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';

import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import AddressAutocompleteInput from '@/components/form/dsfr/AddressAutocompleteInput';
import Select from '@/components/form/dsfr/Select';
import Button from '@/components/ui/Button';
import RichSelect from '@/components/ui/RichSelect';
import type { OutdoorSpace } from '@/modules/app/types';
import type { SuggestionItem } from '@/modules/ban/types';

const outdoorSpaceValues = ['shared', 'private', 'both', 'none'] as const satisfies readonly OutdoorSpace[];

export default function ChoixChauffageForm2() {
  const [address, setAddress] = useQueryState('address');

  const [heatingType, setHeatingType] = useQueryState(
    'type',
    parseAsStringLiteral([
      'immeuble_chauffage_collectif',
      'immeuble_chauffage_individuel',
      'maison_individuelle',
    ] as const satisfies readonly TypeLogement[])
  );

  const [outdoorSpace, setOutdoorSpace] = useQueryState('outdoorSpace', parseAsStringLiteral(outdoorSpaceValues));

  const [loadingStatus, setLoadingStatus] = useState<'idle' | 'loading'>('idle');
  const [geoAddress, setGeoAddress] = useState<SuggestionItem | undefined>();

  const outdoorOptions = useMemo(
    (): { value: OutdoorSpace; label: string; description?: string }[] => [
      { description: 'Cour, jardin, toit terrasse…', label: 'Espaces partagés uniquement', value: 'shared' },
      { description: 'Balcons, terrasses…', label: 'Espaces individuels uniquement', value: 'private' },
      { description: 'Cour, jardin, toit terrasse, balcons…', label: 'Espaces partagés et individuels', value: 'both' },
      { label: 'Aucun espace extérieur', value: 'none' },
    ],
    []
  );

  const isDisabled = !address || !geoAddress || !heatingType || !outdoorSpace || loadingStatus === 'loading';

  return (
    <form className="fr-p-3w bg-[#fbf6ed]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <AddressAutocompleteInput
            className="mb-2!"
            defaultValue={address ?? ''}
            nativeInputProps={{ placeholder: 'Tapez votre adresse ici' }}
            onClear={() => {
              void setAddress(null);
              setGeoAddress(undefined);
            }}
            onSelect={(selected?: SuggestionItem) => {
              const nextAddress = selected?.properties?.label ?? '';
              void setAddress(nextAddress);
              setGeoAddress(selected);
            }}
            onError={() => setLoadingStatus('idle')}
          />
        </div>

        <div>
          <Select
            label="Mode de chauffage"
            options={[
              { label: 'Immeuble en chauffage collectif', value: 'immeuble_chauffage_collectif' satisfies TypeLogement },
              { label: 'Immeuble en chauffage individuel', value: 'immeuble_chauffage_individuel' satisfies TypeLogement },
              { label: 'Maison individuelle', value: 'maison_individuelle' satisfies TypeLogement },
            ]}
            nativeSelectProps={{
              onChange: (e) => void setHeatingType(e.target.value as TypeLogement),
              value: heatingType ?? '',
            }}
          />
        </div>

        <div>
          <RichSelect<OutdoorSpace>
            value={outdoorSpace ?? undefined}
            onChange={(val) => void setOutdoorSpace(val)}
            options={outdoorOptions}
            placeholder="Sélectionner vos espaces disponibles"
            label="Espaces extérieurs"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          size="medium"
          // eventKey=""
          loading={loadingStatus === 'loading'}
          disabled={isDisabled}
          onClick={(e) => {
            e.preventDefault();
            setLoadingStatus('loading');

            console.log('go to', { address, geoAddress, heatingType, outdoorSpace });

            setLoadingStatus('idle');
          }}
        >
          Comparer les solutions
          <span aria-hidden="true" className="text-lg leading-none fr-ml-1w">
            →
          </span>
        </Button>
      </div>
    </form>
  );
}
