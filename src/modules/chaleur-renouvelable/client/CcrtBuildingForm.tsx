import { useStore } from '@tanstack/react-form';

import { Form } from '@/modules/form/Form';

import type { CcrtDemand } from '../types';
import { CcrtBuildingIdentification } from './CcrtBuildingIdentification';
import { CcrtDetailsSection } from './CcrtDetailsSection';
import { CcrtProjectFields } from './CcrtProjectFields';
import { CcrtSimulationFields } from './CcrtSimulationFields';
import { useCcrtBuildingAutosave } from './hooks/useCcrtBuildingAutosave';

const textFields = [
  { label: 'Date ou période du refus de raccordement', name: 'refusal_period' },
  { label: 'Motif du refus', name: 'refusal_reason' },
] as const;

type CcrtBuildingFormProps = { demand: CcrtDemand; onSimulation?: () => void; onMap?: () => void; buildingOnly?: boolean };

/**
 * Edits the demand snapshot with the existing outdoor-space checkboxes and saves a recalculated simulation.
 */
export function CcrtBuildingForm({ demand, onSimulation, onMap, buildingOnly = false }: CcrtBuildingFormProps) {
  const autosave = useCcrtBuildingAutosave(demand);
  const form = autosave.form;
  const hasConnectionRefusal = useStore(form.store, (state) => state.values.is_public_advisor_selected);

  return (
    <Form
      form={form}
      className="min-w-0 space-y-6"
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Element &&
          event.currentTarget.contains(event.relatedTarget) &&
          event.relatedTarget.closest('button')
        ) {
          return;
        }
        if (autosave.hasChanges && !autosave.error) {
          autosave.save();
        }
      }}
    >
      <fieldset className="m-0 space-y-6 border-0 p-0">
        {!buildingOnly && <CcrtBuildingIdentification demand={demand} onMap={onMap} />}
        <CcrtDetailsSection title="Bâtiment et chauffage">
          <CcrtSimulationFields
            form={form}
            fields={{
              annual_heating_consumption: 'annual_heating_consumption',
              average_area: 'average_area',
              average_residents: 'average_residents',
              dpe: 'dpe',
              heating_energy: 'heating_energy',
              hot_water_system_type: 'hot_water_system_type',
              housing_count: 'housing_count',
              housing_type: 'housing_type',
              outdoor_space: 'outdoor_space',
              radiator_type: 'radiator_type',
              surface_area: 'surface_area',
            }}
          />
          <div className="mt-4">
            <form.AppField name="is_public_advisor_selected">
              {(field) => <field.CheckboxField label="Refus de raccordement au réseau de chaleur" />}
            </form.AppField>
          </div>
          {hasConnectionRefusal && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 [&_.fr-input-group]:mb-0">
              {textFields.map((definition) => (
                <form.AppField key={definition.name} name={definition.name}>
                  {(field) => <field.TextField label={definition.label} />}
                </form.AppField>
              ))}
            </div>
          )}
        </CcrtDetailsSection>
        {!buildingOnly && <CcrtProjectFields demand={demand} onSimulation={onSimulation} />}
      </fieldset>
    </Form>
  );
}
