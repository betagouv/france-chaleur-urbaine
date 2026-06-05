import Select from '@/components/form/dsfr/Select';
import RichSelect from '@/components/ui/RichSelect';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import type { SetChoixChauffageParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
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
  geoAddress?: BANAddressFeature;
  setGeoAddress: (val: BANAddressFeature | undefined) => void;
  onAddressError?: () => void;
  onSelectGeoAddress?: (val?: BANAddressFeature) => void;
  typeLogement: TypeLogement | null;
  espaceExterieur: EspaceExterieur | null;
  typeRadiateur?: TypeRadiateur | null;
  setParams: SetChoixChauffageParams;
};

export function SettingsTopFields({
  adresse,
  geoAddress,
  setGeoAddress,
  onSelectGeoAddress,
  typeLogement,
  espaceExterieur,
  typeRadiateur,
  setParams,
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
          if (adresse !== null) void setParams({ adresse: null });
          if (geoAddress !== undefined) setGeoAddress(undefined);
          onSelectGeoAddress?.(undefined);
        }}
        onSelect={(next?: BANAddressFeature) => {
          const nextLabel = next?.properties?.label ?? '';
          if ((adresse ?? '') === nextLabel) return;
          trackPostHogEvent('fcr_landing:address_typed');
          setParams({ adresse: nextLabel });
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
            setParams({ typeLogement: nextTypeLogement });
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
          setParams({ typeRadiateur: value ?? null });
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
          setParams({ espaceExterieur: value });
        }}
        typeLogement={typeLogement}
      />
    </div>
  );
}
