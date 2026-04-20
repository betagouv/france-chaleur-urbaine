import Input from '@codegouvfr/react-dsfr/Input';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';

import type { BANAddressFeature } from '@/modules/ban/types';
import { AddressField } from '@/modules/form/AddressField';
import type { SimulatorFormState, TypeBatiment } from '@/modules/simulator/constants';

const HOT_WATER_OPTIONS = [
  { label: 'Chauffage seul', value: 'non' },
  { label: 'Chauffage et eau chaude sanitaire', value: 'oui' },
];

const BUILDING_TYPE_OPTIONS = [
  { label: 'Résidentiel', value: 'résidentiel' },
  { label: 'Tertiaire', value: 'tertiaire' },
];

const TERTIARY_SECTOR_OPTIONS = [
  { label: 'Bureaux', value: 'Bureaux' },
  { label: 'Enseignement', value: 'Enseignement' },
  { label: 'Commerces', value: 'Commerces' },
  { label: 'Café, restaurant', value: 'Café, restaurant' },
  { label: 'Hôtel', value: 'Hôtel' },
  { label: 'Santé', value: 'Santé' },
  { label: 'Autres', value: 'Autres' },
];

function parseNumericFieldValue(value: number) {
  return Number.isNaN(value) ? undefined : value;
}

type SimulatorFormFieldsProps = {
  addressErrorMessage?: string | null;
  fieldClassName?: string;
  formState: SimulatorFormState;
  onAddressChange: (geoAddress?: BANAddressFeature) => void | Promise<void>;
  onFormStateChange: <Key extends keyof SimulatorFormState>(key: Key, value: SimulatorFormState[Key]) => void;
  onTypeBatimentChange: (value: TypeBatiment) => void;
  showLabels?: boolean;
};
export function SimulatorFormFields({
  addressErrorMessage,
  fieldClassName,
  formState,
  onAddressChange,
  onFormStateChange,
  onTypeBatimentChange,
  showLabels = false,
}: SimulatorFormFieldsProps) {
  return (
    <>
      <AddressField
        label={showLabels ? 'Adresse' : ''}
        state={addressErrorMessage ? 'error' : undefined}
        stateRelatedMessage={addressErrorMessage ?? undefined}
        nativeInputProps={{
          placeholder: 'Tapez ici votre adresse',
          required: true,
        }}
        value={formState.address}
        onSelect={onAddressChange}
        onClear={onAddressChange}
        excludeCities
      />

      <Select
        label={showLabels ? 'Type de bâtiment' : ''}
        options={BUILDING_TYPE_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        }))}
        nativeSelectProps={{
          className: fieldClassName,
          onChange: (event) => onTypeBatimentChange(event.target.value as TypeBatiment),
          value: formState.typeBatiment,
        }}
      />

      {formState.typeBatiment === 'tertiaire' && (
        <>
          <Select
            label={showLabels ? 'Secteur tertiaire' : ''}
            options={TERTIARY_SECTOR_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            nativeSelectProps={{
              className: fieldClassName,
              onChange: (event) => onFormStateChange('tertiarySector', event.target.value as SimulatorFormState['tertiarySector']),
              value: formState.tertiarySector,
            }}
          />

          <Select
            label={showLabels ? "Production d'eau chaude sanitaire" : ''}
            options={HOT_WATER_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            nativeSelectProps={{
              className: fieldClassName,
              onChange: (event) => onFormStateChange('producesHotWater', event.target.value as SimulatorFormState['producesHotWater']),
              value: formState.producesHotWater,
            }}
          />
        </>
      )}

      {formState.typeBatiment === 'résidentiel' ? (
        <Input
          label={showLabels ? 'Nombre de logements' : ''}
          nativeInputProps={{
            className: fieldClassName,
            inputMode: 'numeric',
            min: 1,
            onChange: (event) => onFormStateChange('nbLogements', parseNumericFieldValue(event.currentTarget.valueAsNumber)),
            pattern: '[0-9]*',
            placeholder: showLabels ? undefined : 'Nombre de logements',
            type: 'number',
            value: formState.nbLogements ?? '',
          }}
        />
      ) : (
        <Input
          label={showLabels ? 'Surface (m²)' : ''}
          nativeInputProps={{
            className: fieldClassName,
            inputMode: 'numeric',
            min: 1,
            onChange: (event) => onFormStateChange('surface', parseNumericFieldValue(event.currentTarget.valueAsNumber)),
            pattern: '[0-9]*',
            placeholder: showLabels ? undefined : 'Surface (m²)',
            type: 'number',
            value: formState.surface ?? '',
          }}
        />
      )}
    </>
  );
}
