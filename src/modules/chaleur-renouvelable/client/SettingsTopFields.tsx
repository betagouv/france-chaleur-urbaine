import Select from '@/components/form/dsfr/Select';
import RichSelect from '@/components/ui/RichSelect';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import {
  type EspaceExterieur,
  type TypeLogement,
  type TypeRadiateur,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import { AddressField } from '@/modules/form/AddressField';

import { OutdoorSpaceSelect } from './OutdoorSpaceSelect';

type SettingsTopFieldsProps = {
  adresse: string | null;
  setAdresse: (val: string | null) => void;
  geoAddress?: BANAddressFeature;
  setGeoAddress: (val: BANAddressFeature | undefined) => void;
  onAddressError?: () => void;
  onSelectGeoAddress?: (val?: BANAddressFeature) => void;
  typeLogement: TypeLogement | null;
  setTypeLogement: (val: TypeLogement | null) => void;
  espaceExterieur: EspaceExterieur | null;
  setEspaceExterieur: (val: EspaceExterieur | null) => void;
  typeRadiateur?: TypeRadiateur | null;
  setTypeRadiateur: (val: TypeRadiateur | null) => void;
};

export function SettingsTopFields({
  adresse,
  setAdresse,
  geoAddress,
  setGeoAddress,
  onSelectGeoAddress,
  typeLogement,
  setTypeLogement,
  espaceExterieur,
  setEspaceExterieur,
  typeRadiateur,
  setTypeRadiateur,
}: SettingsTopFieldsProps) {
  return (
    <div className="fr-p-3w grid grid-cols-1 gap-4 md:grid-cols-4 bg-[#fbf6ed]">
      <AddressField
        label="Adresse"
        className="fr-mb-0"
        value={adresse ?? ''}
        nativeInputProps={{ placeholder: 'Tapez votre adresse ici' }}
        onlyAddress
        onClear={() => {
          if (adresse !== null) void setAdresse(null);
          if (geoAddress !== undefined) setGeoAddress(undefined);
          onSelectGeoAddress?.(undefined);
        }}
        onSelect={(next?: BANAddressFeature) => {
          const nextLabel = next?.properties?.label ?? '';
          if ((adresse ?? '') === nextLabel) return;
          trackPostHogEvent('fcr_landing:address_typed');
          setAdresse(nextLabel);
          setGeoAddress(next);
          onSelectGeoAddress?.(next);
        }}
      />
      <Select
        label="Mode de chauffage"
        className="fr-mb-0"
        options={[...typeLogementOptions]}
        nativeSelectProps={{
          onChange: (e) => {
            const nextTypeLogement = (e.target.value || null) as TypeLogement | null;
            if (nextTypeLogement) {
              trackPostHogEvent('fcr_landing:heating_mode_selected', { heating_mode: nextTypeLogement });
            }
            setTypeLogement(nextTypeLogement);
          },
          value: typeLogement ?? undefined,
        }}
      />
      <RichSelect<TypeRadiateur>
        value={typeRadiateur ?? undefined}
        onChange={(value) => {
          if (value) {
            trackPostHogEvent('fcr_landing:emitter_type_selected', { emitter_type: value });
          }
          setTypeRadiateur(value ?? null);
        }}
        options={[...typeRadiateurOptions]}
        placeholder="Indiquez votre type de radiateur"
        label="Type de radiateurs"
      />
      <OutdoorSpaceSelect
        value={espaceExterieur}
        onChange={(value) => {
          if (value) {
            trackPostHogEvent('fcr_landing:outdoor_space_selected', { outdoor_space: value });
          }
          setEspaceExterieur(value);
        }}
        typeLogement={typeLogement}
      />
    </div>
  );
}
