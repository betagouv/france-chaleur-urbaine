import Select from '@/components/form/dsfr/Select';
import { type EspaceExterieur, getEspaceExterieurOptions, type TypeLogement } from '@/modules/chaleur-renouvelable/constants';

type OutdoorSpaceSelectProps = {
  onChange: (value: EspaceExterieur | null) => void;
  typeLogement: TypeLogement | null;
  value: EspaceExterieur | null;
};

export function OutdoorSpaceSelect({ onChange, typeLogement, value }: OutdoorSpaceSelectProps) {
  const isDisabled = !typeLogement;
  const options = getEspaceExterieurOptions(typeLogement);

  return (
    <Select
      label="Espaces extérieurs"
      options={[
        {
          disabled: true,
          label: isDisabled ? "Renseignez d'abord le mode de chauffage" : 'Sélectionnez vos espaces disponibles',
          value: '',
        },
        ...options,
      ]}
      nativeSelectProps={{
        disabled: isDisabled,
        onChange: (event) => onChange((event.target.value || null) as EspaceExterieur | null),
        required: !isDisabled,
        value: value ?? '',
      }}
    />
  );
}
