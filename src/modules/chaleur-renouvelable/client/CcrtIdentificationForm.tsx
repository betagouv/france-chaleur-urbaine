import { useStore } from '@tanstack/react-form';

import Button from '@/components/ui/Button';
import { Form } from '@/modules/form/Form';

import { hasOrganizationNameField, occupantStatusOptions } from '../constants';
import type { CcrtDemand } from '../types';
import { CcrtBuildingIdentification } from './CcrtBuildingIdentification';
import { CcrtDetailsSection } from './CcrtDetailsSection';
import { useCcrtIdentificationForm } from './hooks/useCcrtIdentificationForm';

const buildingFields = [
  { label: 'SIRET du représentant légal', name: 'rnic_siret_representant_legal' },
  { label: 'Immatriculation de la copropriété', name: 'rnic_numero_immatriculation' },
] as const;
const requesterFields = [
  { label: 'Prénom', name: 'first_name' },
  { label: 'Nom', name: 'last_name' },
] as const;

type CcrtIdentificationFormProps = { demand: CcrtDemand; onMap?: () => void };

/** Shared identity editor for the admin and CCRT sheets. */
export function CcrtIdentificationForm({ demand, onMap }: CcrtIdentificationFormProps) {
  const { form, hasChanges, isSaving, error, reset, save } = useCcrtIdentificationForm(demand);
  const occupantStatus = useStore(form.store, (state) => state.values.occupant_status);
  return (
    <Form
      form={form}
      className="min-w-0 space-y-4"
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Element &&
          event.currentTarget.contains(event.relatedTarget) &&
          event.relatedTarget.closest('button')
        ) {
          return;
        }
        if (hasChanges && !error && !demand.archived_at) {
          save();
        }
      }}
    >
      <fieldset disabled={demand.archived_at !== null} className="m-0 min-w-0 border-0 p-0">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <CcrtBuildingIdentification demand={demand} onMap={onMap}>
            <div className="grid gap-6 sm:grid-cols-2 [&_.fr-input-group]:mb-0">
              <div className="sm:col-span-2 mt-3.25">
                <form.AppField name="rnic_nom_copropriete">{(field) => <field.TextField label="Syndicat de copropriété" />}</form.AppField>
              </div>
              {buildingFields.map(({ name, label }) => (
                <form.AppField key={name} name={name}>
                  {(field) => <field.TextField label={label} />}
                </form.AppField>
              ))}
            </div>
          </CcrtBuildingIdentification>
          <CcrtDetailsSection title="Identification du demandeur">
            <div className="grid gap-4 sm:grid-cols-2 [&_.fr-input-group]:mb-0 [&_.fr-select-group]:mb-0">
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <form.AppField name="occupant_status">
                  {(field) => <field.SelectField label="Type de demandeur" options={occupantStatusOptions} />}
                </form.AppField>
                {hasOrganizationNameField(occupantStatus) && (
                  <form.AppField name="organization_name">{(field) => <field.TextField label="Nom de la structure" />}</form.AppField>
                )}
              </div>
              {requesterFields.map(({ name, label }) => (
                <form.AppField key={name} name={name}>
                  {(field) => <field.TextField label={label} />}
                </form.AppField>
              ))}
              <form.AppField name="email">{(field) => <field.EmailField label="Email" />}</form.AppField>
              <form.AppField name="phone">{(field) => <field.PhoneField label="Téléphone" />}</form.AppField>
            </div>
          </CcrtDetailsSection>
        </div>
      </fieldset>
      {error && (
        <p className="mb-0 text-sm" role="alert">
          Échec de l’enregistrement : {error.message}
        </p>
      )}
      {error && (
        <div className="flex flex-wrap gap-3">
          {error.data?.code !== 'CONFLICT' && (
            <Button size="small" priority="secondary" disabled={isSaving} onClick={save}>
              Réessayer
            </Button>
          )}
          <Button size="small" priority="tertiary" disabled={isSaving} onClick={reset}>
            {error.data?.code === 'CONFLICT' ? 'Abandonner mes modifications et recharger' : 'Annuler les modifications'}
          </Button>
        </div>
      )}
    </Form>
  );
}
