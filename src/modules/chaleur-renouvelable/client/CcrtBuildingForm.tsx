import { useStore } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';
import type { z } from 'zod';

import Button from '@/components/ui/Button';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

import { MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE, zCcrtBuilding } from '../constants';
import type { CcrtDemand } from '../types';
import { CcrtDetailsSection } from './CcrtDetailsSection';
import { CcrtProjectFields } from './CcrtProjectFields';
import { CcrtSimulationFields } from './CcrtSimulationFields';

const identificationFields = [
  { label: 'Adresse du bâtiment', name: 'address' },
  { label: 'Syndicat de copropriété', name: 'rnic_nom_copropriete' },
  { label: 'SIRET (source : RNIC)', name: 'rnic_siret_representant_legal' },
  { label: 'Immatriculation de copropriété (source : RNIC)', name: 'rnic_numero_immatriculation' },
] as const;
const textFields = [
  { label: 'Date ou période du refus de raccordement', name: 'refusal_period' },
  { label: 'Motif du refus', name: 'refusal_reason' },
] as const;

type CcrtBuildingFormProps = { demand: CcrtDemand; onSimulation?: () => void };

/**
 * Edits the demand snapshot with the existing outdoor-space checkboxes and saves a recalculated simulation.
 */
export function CcrtBuildingForm({ demand, onSimulation }: CcrtBuildingFormProps) {
  const utils = trpc.useUtils();
  const mutation = trpc.batEnr.ccrt.updateBuilding.useMutation();
  const updatedAt = useRef(demand.updated_at);
  const defaultValues = useRef(getBuildingDefaultValues(demand));
  const form = useAppForm({
    ...schemaValidation(zCcrtBuilding),
    defaultValues: defaultValues.current,
    onSubmit: toastErrors(async ({ value }) => {
      const result = await mutation.mutateAsync({ demandId: demand.id, updatedAt: updatedAt.current, values: value });
      updatedAt.current = result.updatedAt;
      await Promise.all([
        utils.batEnr.ccrt.listDemandesChaleurRenouvelable.invalidate(),
        utils.batEnr.admin.listDemandesChaleurRenouvelable.invalidate(),
        utils.batEnr.ccrt.getFollowUp.invalidate({ demandId: demand.id }),
        utils.batEnr.ccrt.getHeatNetworkEligibility.invalidate({ demandId: demand.id }),
      ]);
      defaultValues.current = value;
      form.reset(value);
    }),
  });
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const hasConnectionRefusal = useStore(form.store, (state) => state.values.is_public_advisor_selected);

  // Refresh clean forms after a server update while preserving an unsaved draft and its conflict token.
  useEffect(() => {
    if (!form.state.isDirty) {
      defaultValues.current = getBuildingDefaultValues(demand);
      form.reset(defaultValues.current);
      updatedAt.current = demand.updated_at;
    }
  }, [demand, form]);

  return (
    <Form form={form} className="min-w-0 space-y-6">
      <fieldset disabled={isSubmitting} className="m-0 space-y-6 border-0 p-0">
        <CcrtDetailsSection
          title="Identification du bâtiment"
          description={`Demande n° ${demand.id}, reçue le ${dayjs(demand.created_at).format('D MMM YYYY')}`}
        >
          {identificationFields.map((definition) => (
            <p key={definition.name} className="mb-0 break-words text-sm leading-6 text-(--text-default-grey)">
              {definition.label} : <span className="text-base font-medium">{demand[definition.name] || 'Non renseigné'}</span>
            </p>
          ))}
        </CcrtDetailsSection>
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
              {(field) => <field.CheckboxField label="Refus de raccordement" />}
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
        <CcrtProjectFields demand={demand} onSimulation={onSimulation} />
      </fieldset>
      <div className="mt-4 flex flex-wrap gap-3">
        <form.SubmitButton disabled={isSubmitting || !isDirty}>Enregistrer et recalculer</form.SubmitButton>
        <Button
          priority="tertiary"
          disabled={isSubmitting || !isDirty}
          onClick={() => {
            defaultValues.current = getBuildingDefaultValues(demand);
            form.reset(defaultValues.current);
            updatedAt.current = demand.updated_at;
          }}
        >
          Annuler
        </Button>
      </div>
    </Form>
  );
}

/**
 * Normalizes nullable snapshot fields for the editable controls without discarding the stored values.
 */
const getBuildingDefaultValues = (demand: CcrtDemand): z.input<typeof zCcrtBuilding> => {
  return {
    ...zCcrtBuilding.parse(demand),
    annual_heating_consumption: demand.annual_heating_consumption ?? undefined,
    comments: demand.comments ?? '',
    hot_water_system_type: demand.hot_water_system_type ?? MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
    refusal_period: demand.refusal_period ?? '',
    refusal_reason: demand.refusal_reason ?? '',
    surface_area: demand.surface_area ?? undefined,
  };
};
