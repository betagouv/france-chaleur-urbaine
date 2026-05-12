import Select from '@/components/form/dsfr/Select';
import RichSelect from '@/components/ui/RichSelect';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import {
  type EspaceExterieur,
  getEspaceExterieurOptions,
  isEspaceExterieurCompatible,
  type TypeLogement,
  type TypeRadiateur,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import { AddressField } from '@/modules/form/AddressField';

type SettingsTopFieldsProps = {
  withLabel: boolean;
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
  setTypeRadiateur?: (val: TypeRadiateur | null) => void;
  className?: string;
};

export function SettingsTopFields({
  withLabel,
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
  className,
}: SettingsTopFieldsProps) {
  const espaceExterieurOptions = getEspaceExterieurOptions(typeLogement);
  const isEspaceExterieurDisabled = !typeLogement;

  return (
    <div className={className}>
      <AddressField
        label={withLabel ? 'Adresse' : ''}
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
            source: withLabel ? 'landing' : 'result',
          });
          trackPostHogEvent('fcr_simulator:started', {
            address: nextLabel,
            source: withLabel ? 'landing' : 'result',
          });
          setAdresse(nextLabel);
          setGeoAddress(next);
          onSelectGeoAddress?.(next);
        }}
      />
      <Select
        label={withLabel ? 'Mode de chauffage' : ''}
        className="fr-mb-0"
        options={[...typeLogementOptions]}
        nativeSelectProps={{
          onChange: (e) => {
            const nextTypeLogement = (e.target.value || null) as TypeLogement | null;
            trackPostHogEvent('fcr_simulator:started', {
              source: withLabel ? 'landing' : 'result',
              typeLogement: nextTypeLogement,
            });
            trackPostHogEvent('fcr_simulator:heating_mode_selected', { typeLogement: nextTypeLogement });
            void setTypeLogement(nextTypeLogement);

            if (!isEspaceExterieurCompatible(nextTypeLogement, espaceExterieur)) {
              void setEspaceExterieur(null);
            }
          },
          value: typeLogement ?? undefined,
        }}
      />
      {setTypeRadiateur && (
        <RichSelect<TypeRadiateur>
          value={typeRadiateur ?? undefined}
          onChange={(val) => void setTypeRadiateur(val ?? null)}
          options={[...typeRadiateurOptions]}
          placeholder="Indiquez votre type de radiateur"
          label={withLabel ? 'Type de radiateurs' : ''}
        />
      )}
      <RichSelect<EspaceExterieur>
        value={espaceExterieur ?? undefined}
        onChange={(val) => {
          trackPostHogEvent('fcr_simulator:started', {
            espaceExterieur: val,
            source: withLabel ? 'landing' : 'result',
          });
          trackPostHogEvent('fcr_simulator:outdoor_space_selected', { outdoorSpace: val as EspaceExterieur });
          void setEspaceExterieur(val);
        }}
        options={[...espaceExterieurOptions]}
        placeholder={isEspaceExterieurDisabled ? "Renseignez d'abord le mode de chauffage" : 'Sélectionner vos espaces disponibles'}
        label={withLabel ? 'Espaces extérieurs' : ''}
        disabled={isEspaceExterieurDisabled}
      />
    </div>
  );
}
