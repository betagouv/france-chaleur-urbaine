import Input from '@codegouvfr/react-dsfr/Input';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';

import type { BANAddressFeature } from '@/modules/ban/types';
import { AddressField } from '@/modules/form/AddressField';
import type { SimulatorFormState, TypeBatiment } from '@/modules/simulator/constants';

type SimulatorFormFieldsProps = {
  address: string;
  fieldClassName?: string;
  formState: SimulatorFormState;
  isAddressSelected: boolean;
  onAddressChange: (geoAddress?: BANAddressFeature) => void | Promise<void>;
  onFormStateChange: <Key extends keyof SimulatorFormState>(key: Key, value: SimulatorFormState[Key]) => void;
  onTypeBatimentChange: (value: TypeBatiment) => void;
  showLabels?: boolean;
};

const HOT_WATER_OPTIONS = [
  { label: 'Chauffage seul', value: 'non' },
  { label: 'Chauffage et eau chaude sanitaire', value: 'oui' },
];

const BUILDING_TYPE_OPTIONS = [
  { label: 'Résidentiel', value: 'residentiel' },
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

/**
 * Renders the shared address and building fields used by both heat-network simulators.
 */
export function SimulatorFormFields({
  address,
  fieldClassName,
  formState,
  isAddressSelected,
  onAddressChange,
  onFormStateChange,
  onTypeBatimentChange,
  showLabels = false,
}: SimulatorFormFieldsProps) {
  const addressLabel = showLabels ? 'Adresse' : '';
  const buildingTypeLabel = showLabels ? 'Type de bâtiment' : '';
  const tertiarySectorLabel = showLabels ? 'Secteur tertiaire' : '';
  const hotWaterLabel = showLabels ? "Production d'eau chaude sanitaire" : '';

  return (
    <>
      <AddressField
        label={addressLabel}
        nativeInputProps={{
          placeholder: 'Tapez ici votre adresse',
          required: true,
        }}
        value={address}
        onSelect={onAddressChange}
        onClear={onAddressChange}
        excludeCities
      />

      <Select
        label={buildingTypeLabel}
        options={BUILDING_TYPE_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        }))}
        nativeSelectProps={{
          className: fieldClassName,
          disabled: !isAddressSelected,
          onChange: (event) => onTypeBatimentChange(event.target.value as TypeBatiment),
          value: formState.typeBatiment,
        }}
      />

      {formState.typeBatiment === 'tertiaire' && (
        <>
          <Select
            label={tertiarySectorLabel}
            options={TERTIARY_SECTOR_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            nativeSelectProps={{
              className: fieldClassName,
              disabled: !isAddressSelected,
              onChange: (event) => onFormStateChange('tertiarySector', event.target.value as SimulatorFormState['tertiarySector']),
              value: formState.tertiarySector,
            }}
          />

          <Select
            label={hotWaterLabel}
            options={HOT_WATER_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            nativeSelectProps={{
              className: fieldClassName,
              disabled: !isAddressSelected,
              onChange: (event) => onFormStateChange('producesHotWater', event.target.value as SimulatorFormState['producesHotWater']),
              value: formState.producesHotWater,
            }}
          />
        </>
      )}

      {formState.typeBatiment === 'residentiel' ? (
        <Input
          label={showLabels ? 'Nombre de logements' : ''}
          nativeInputProps={{
            className: fieldClassName,
            disabled: !isAddressSelected,
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
            disabled: !isAddressSelected,
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
