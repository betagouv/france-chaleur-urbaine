import { useStore } from '@tanstack/react-form';
import type { z } from 'zod';

import { withFieldGroup } from '@/modules/form/useAppForm';

import {
  DPE_VALUES,
  getModeEauChaudeSanitaireOptions,
  heatingEnergyOptions,
  MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
  normalizeModeEauChaudeSanitaireForTypeLogement,
  typeLogementOptions,
  typeRadiateurOptions,
  type zCcrtBuilding,
} from '../constants';
import { OutdoorSpaceCheckboxes } from './OutdoorSpaceCheckboxes';
import { SimulationNumberField } from './SimulationNumberField';

const defaultValues: Pick<
  z.input<typeof zCcrtBuilding>,
  | 'annual_heating_consumption'
  | 'heating_energy'
  | 'surface_area'
  | 'housing_type'
  | 'radiator_type'
  | 'hot_water_system_type'
  | 'average_area'
  | 'average_residents'
  | 'housing_count'
  | 'dpe'
  | 'outdoor_space'
> = {
  annual_heating_consumption: undefined,
  average_area: 70,
  average_residents: 2,
  dpe: 'D',
  heating_energy: 'Gaz',
  hot_water_system_type: null,
  housing_count: 25,
  housing_type: 'immeuble_chauffage_collectif',
  outdoor_space: 'none',
  radiator_type: null,
  surface_area: undefined,
};

/**
 * Editable CCRT simulation settings using the public simulator's controls and conditional hot-water options.
 */
export const CcrtSimulationFields = withFieldGroup<typeof defaultValues, unknown>({ defaultValues, render: CcrtSimulationFieldsRender });

type CcrtSimulationFieldsRenderProps = Parameters<Parameters<typeof withFieldGroup<typeof defaultValues, unknown>>[0]['render']>[0];

function CcrtSimulationFieldsRender({ group }: CcrtSimulationFieldsRenderProps) {
  const housingType = useStore(group.store, (state) => state.values.housing_type);

  return (
    <div className="grid gap-4 md:grid-cols-2 [&_.fr-input-group]:mb-0 [&_.fr-select-group]:mb-0">
      <group.AppField
        name="housing_type"
        listeners={{
          onChange: ({ value }) => {
            group.setFieldValue(
              'hot_water_system_type',
              normalizeModeEauChaudeSanitaireForTypeLogement(group.getFieldValue('hot_water_system_type'), value),
              { dontUpdateMeta: true }
            );
          },
        }}
      >
        {(field) => <field.SelectField label="Type de logement" options={typeLogementOptions} />}
      </group.AppField>
      <group.AppField name="heating_energy">
        {(field) => <field.SelectField label="Énergie de chauffage" options={heatingEnergyOptions} />}
      </group.AppField>
      <div className="md:col-span-2">
        <group.AppField name="outdoor_space">
          {(field) => <field.CustomField Component={OutdoorSpaceCheckboxes} label="Espaces extérieurs" layout="row" />}
        </group.AppField>
      </div>
      <group.AppField name="radiator_type">
        {(field) => <field.SelectField label="Type de radiateurs" hideOptionalLabel options={typeRadiateurOptions} />}
      </group.AppField>
      <group.AppField name="hot_water_system_type">
        {(field) => (
          <field.SelectField
            label="Mode eau chaude"
            hideOptionalLabel
            options={[
              { label: 'Non renseigné', value: MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE },
              ...getModeEauChaudeSanitaireOptions(housingType),
            ]}
          />
        )}
      </group.AppField>
      <group.AppField name="housing_count">
        {(field) => (
          <field.NumberField label="Nombre de logements" nativeInputProps={{ inputMode: 'numeric', min: 1, placeholder: '25', step: 1 }} />
        )}
      </group.AppField>
      <group.AppField name="average_area">
        {() => <SimulationNumberField label="Surface moyenne" suffix="m²" placeholder="70" inputMode="numeric" min="0" step="1" />}
      </group.AppField>
      <group.AppField name="average_residents">
        {() => <SimulationNumberField label="Habitants moyens" suffix="personnes" placeholder="2" inputMode="decimal" min="0" step="0.1" />}
      </group.AppField>
      <group.AppField name="dpe">
        {(field) => <field.SelectField label="DPE" options={DPE_VALUES.map((value) => ({ label: value, value }))} />}
      </group.AppField>
      <group.AppField name="annual_heating_consumption">
        {() => (
          <SimulationNumberField label="Consommation bâtiment" suffix="MWh/an" placeholder="0" inputMode="decimal" min="0" step="any" />
        )}
      </group.AppField>
      <group.AppField name="surface_area">
        {(field) => <field.NumberField label="Surface totale (m²)" nativeInputProps={{ min: 0, step: 'any' }} />}
      </group.AppField>
    </div>
  );
}
