import Input from '@codegouvfr/react-dsfr/Input';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';

import type { BANAddressFeature } from '@/modules/ban/types';
import { AddressField } from '@/modules/form/AddressField';
import type { HotWaterProduction, TertiarySector, TypeBatiment } from '@/modules/simulator/constants';

type SimulatorFormFieldsProps = {
  address: string;
  eligibilityError: boolean;
  fieldClassName?: string;
  isAddressSelected: boolean;
  mainValue: number | string | undefined;
  minValue?: number;
  onAddressClear: () => void;
  onAddressSelect: (geoAddress?: BANAddressFeature) => void | Promise<void>;
  onMainValueChange: (value: string) => void;
  onProducesHotWaterChange: (value: HotWaterProduction) => void;
  onTertiarySectorChange: (value: TertiarySector) => void;
  onTypeBatimentChange: (value: TypeBatiment) => void;
  producesHotWater: HotWaterProduction;
  showLabels?: boolean;
  tertiarySector: TertiarySector;
  typeBatiment: TypeBatiment;
};

const HOT_WATER_OPTIONS = [
  { label: 'Chauffage seul', value: 'non' },
  { label: 'Chauffage et eau chaude sanitaire', value: 'oui' },
] as const;

const BUILDING_TYPE_OPTIONS = [
  { label: 'Résidentiel', value: 'residentiel' },
  { label: 'Tertiaire', value: 'tertiaire' },
] as const;

const TERTIARY_SECTOR_OPTIONS = [
  { label: 'Bureaux', value: 'Bureaux' },
  { label: 'Enseignement', value: 'Enseignement' },
  { label: 'Commerces', value: 'Commerces' },
  { label: 'Café, restaurant', value: 'Café, restaurant' },
  { label: 'Hôtel', value: 'Hôtel' },
  { label: 'Santé', value: 'Santé' },
  { label: 'Autres', value: 'Autres' },
] as const;

function getMainFieldLabel(typeBatiment: TypeBatiment) {
  return typeBatiment === 'residentiel' ? 'Nombre de logements' : 'Surface (m²)';
}

/**
 * Renders the shared address and building fields used by both heat-network simulators.
 */
export function SimulatorFormFields({
  address,
  eligibilityError,
  fieldClassName,
  isAddressSelected,
  mainValue,
  minValue = 1,
  onAddressClear,
  onAddressSelect,
  onMainValueChange,
  onProducesHotWaterChange,
  onTertiarySectorChange,
  onTypeBatimentChange,
  producesHotWater,
  showLabels = false,
  tertiarySector,
  typeBatiment,
}: SimulatorFormFieldsProps) {
  const addressLabel = showLabels ? 'Adresse' : '';
  const buildingTypeLabel = showLabels ? 'Type de bâtiment' : '';
  const tertiarySectorLabel = showLabels ? 'Secteur tertiaire' : '';
  const hotWaterLabel = showLabels ? "Production d'eau chaude sanitaire" : '';
  const mainFieldLabel = getMainFieldLabel(typeBatiment);

  return (
    <>
      <AddressField
        label={addressLabel}
        state={eligibilityError ? 'error' : undefined}
        stateRelatedMessage={eligibilityError ? "Une erreur est survenue pendant le test d'éligibilité." : undefined}
        nativeInputProps={{
          placeholder: 'Tapez ici votre adresse',
          required: true,
        }}
        value={address}
        onSelect={onAddressSelect}
        onClear={onAddressClear}
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
          value: typeBatiment,
        }}
      />

      {typeBatiment === 'tertiaire' && (
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
              onChange: (event) => onTertiarySectorChange(event.target.value as TertiarySector),
              value: tertiarySector,
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
              onChange: (event) => onProducesHotWaterChange(event.target.value as HotWaterProduction),
              value: producesHotWater,
            }}
          />
        </>
      )}

      <Input
        label={showLabels ? mainFieldLabel : ''}
        nativeInputProps={{
          className: fieldClassName,
          disabled: !isAddressSelected,
          inputMode: 'numeric',
          min: minValue,
          onChange: (event) => onMainValueChange(event.target.value),
          pattern: '[0-9]*',
          placeholder: showLabels ? undefined : mainFieldLabel,
          type: 'number',
          value: mainValue ?? '',
        }}
      />
    </>
  );
}
