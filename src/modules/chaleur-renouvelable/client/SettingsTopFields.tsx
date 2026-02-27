import AddressAutocompleteInput from '@/components/form/dsfr/AddressAutocompleteInput';
import Select from '@/components/form/dsfr/Select';
import RichSelect from '@/components/ui/RichSelect';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { EspaceExterieur } from '@/modules/app/types';
import type { SuggestionItem } from '@/modules/ban/types';
import { espaceExterieurOptions } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import type { TypeLogement } from '@/modules/chaleur-renouvelable/client/type-logement';

type SettingsTopFieldsProps = {
  withLabel: boolean;
  adresse: string | null;
  setAdresse: (val: string | null) => void;
  geoAddress?: SuggestionItem;
  setGeoAddress: (val: SuggestionItem | undefined) => void;
  onAddressError?: () => void;
  onSelectGeoAddress?: (val?: SuggestionItem) => void;
  typeLogement: TypeLogement | null;
  setTypeLogement: (val: TypeLogement | null) => void;
  espaceExterieur: EspaceExterieur | null;
  setEspaceExterieur: (val: EspaceExterieur | null) => void;
  className?: string;
};

export function SettingsTopFields({
  withLabel,
  adresse,
  setAdresse,
  geoAddress,
  setGeoAddress,
  onAddressError,
  onSelectGeoAddress,
  typeLogement,
  setTypeLogement,
  espaceExterieur,
  setEspaceExterieur,
  className,
}: SettingsTopFieldsProps) {
  return (
    <div className={className}>
      <AddressAutocompleteInput
        label={withLabel ? 'Adresse' : ''}
        className="fr-mb-0"
        defaultValue={adresse ?? undefined}
        nativeInputProps={{ placeholder: 'Tapez votre adresse ici' }}
        onlyAddress
        onClear={() => {
          if (adresse !== null) void setAdresse(null);
          if (geoAddress !== undefined) setGeoAddress(undefined);
          onSelectGeoAddress?.(undefined);
        }}
        onSelect={(next?: SuggestionItem) => {
          const nextLabel = next?.properties?.label ?? '';
          if ((adresse ?? '') === nextLabel) return;
          trackPostHogEvent('chaleur-renouvelable:address_select', {
            address: nextLabel,
            source: withLabel ? 'landing' : 'result',
          });
          setAdresse(nextLabel);
          setGeoAddress(next);
          onSelectGeoAddress?.(next);
        }}
        onError={onAddressError}
      />
      <Select
        label={withLabel ? 'Mode de chauffage' : ''}
        className="fr-mb-0"
        options={[
          { label: 'Immeuble en chauffage collectif', value: 'immeuble_chauffage_collectif' satisfies TypeLogement },
          { label: 'Immeuble en chauffage individuel', value: 'immeuble_chauffage_individuel' satisfies TypeLogement },
          { label: 'Maison individuelle', value: 'maison_individuelle' satisfies TypeLogement },
        ]}
        nativeSelectProps={{
          onChange: (e) => void setTypeLogement(e.target.value as TypeLogement),
          value: typeLogement ?? '',
        }}
      />
      <RichSelect<EspaceExterieur>
        value={espaceExterieur ?? undefined}
        onChange={(val) => void setEspaceExterieur(val)}
        options={[...espaceExterieurOptions]}
        placeholder="Sélectionner vos espaces disponibles"
        label={withLabel ? 'Espaces extérieurs disponibles' : ''}
      />
    </div>
  );
}
