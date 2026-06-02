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
          trackPostHogEvent('fcr_simulator:address_selected', {
            address: nextLabel,
            source: 'landing',
          });
          trackPostHogEvent('fcr_simulator:started', {
            address: nextLabel,
            source: 'landing',
          });
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
            trackPostHogEvent('fcr_simulator:started', {
              source: 'landing',
              typeLogement: nextTypeLogement ?? undefined,
            });
            if (nextTypeLogement) {
              trackPostHogEvent('fcr_simulator:heating_mode_selected', { typeLogement: nextTypeLogement });
            }
            setTypeLogement(nextTypeLogement);
          },
          value: typeLogement ?? undefined,
        }}
      />
      <RichSelect<TypeRadiateur>
        value={typeRadiateur ?? undefined}
        onChange={(val) => setTypeRadiateur(val ?? null)}
        options={[...typeRadiateurOptions]}
        placeholder="Indiquez votre type de radiateur"
        label="Type de radiateurs"
      />
      <OutdoorSpaceSelect
        value={espaceExterieur}
        onChange={(val) => {
          trackPostHogEvent('fcr_simulator:started', {
            espaceExterieur: val ?? undefined,
            source: 'landing',
          });
          if (val) {
            trackPostHogEvent('fcr_simulator:outdoor_space_selected', { outdoorSpace: val });
          }
          setEspaceExterieur(val);
        }}
        label="Espaces extérieurs"
        typeLogement={typeLogement}
      />
    </div>
  );
}
