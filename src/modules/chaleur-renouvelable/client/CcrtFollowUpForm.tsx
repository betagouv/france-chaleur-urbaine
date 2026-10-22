import { useStore } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';

import Tag from '@/components/ui/Tag';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';

import {
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION,
  demandeChaleurRenouvelableProjectStates,
  demandeChaleurRenouvelableStatuses,
  zCcrtFollowUpForm,
} from '../constants';
import type { CcrtDemand, CcrtDemandUpdate } from '../types';

type CcrtFollowUpFormProps = {
  demand: Pick<CcrtDemand, 'status' | 'project_state'>;
  isUpdating: boolean;
  onUpdate: (values: CcrtDemandUpdate) => Promise<void>;
  onSaved: () => void;
};

/**
 * Saves status, project state and an optional note together through the single follow-up action.
 */
export function CcrtFollowUpForm({ demand, isUpdating, onUpdate, onSaved }: CcrtFollowUpFormProps) {
  const defaultValues = useRef(getFollowUpDefaultValues(demand));
  const form = useAppForm({
    ...schemaValidation(zCcrtFollowUpForm),
    defaultValues: defaultValues.current,
    onSubmit: toastErrors(async ({ value }) => {
      await onUpdate({
        ...(value.status !== defaultValues.current.status && { status: value.status }),
        ...(value.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION &&
          value.projectState !== defaultValues.current.projectState && { projectState: value.projectState }),
        ...(value.note.trim() && { note: value.note.trim() }),
      });
      defaultValues.current = { ...value, note: '' };
      form.reset(defaultValues.current);
      onSaved();
    }),
  });
  const selectedStatus = useStore(form.store, (state) => state.values.status);
  const note = useStore(form.store, (state) => state.values.note);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isDirty = useStore(form.store, (state) => state.isDirty);

  // Server refreshes update clean controls without discarding a note or status still being drafted.
  useEffect(() => {
    if (!isDirty) {
      defaultValues.current = getFollowUpDefaultValues(demand);
      form.reset(defaultValues.current);
    }
  }, [demand, form, isDirty]);

  return (
    <Form form={form} className="[&_.fr-label]:text-sm [&_.fr-label]:leading-6 [&_.fr-label]:text-(--text-default-grey)">
      <fieldset disabled={isUpdating || isSubmitting} className="m-0 border-0 px-4 pb-4 pt-0">
        <form.AppField name="status">
          {(field) => (
            <field.SelectField
              label="Où en êtes-vous du suivi de la demande ?"
              hideOptionalLabel
              options={demandeChaleurRenouvelableStatuses.map((status) => ({ label: status.label, value: status.label }))}
            />
          )}
        </form.AppField>
        {selectedStatus === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION && (
          <form.AppField name="projectState">
            {(field) => (
              <field.SelectField
                label="État du projet"
                hideOptionalLabel
                options={demandeChaleurRenouvelableProjectStates.map((state) => ({ label: state.label, value: state.label }))}
              />
            )}
          </form.AppField>
        )}
      </fieldset>
      <fieldset
        disabled={isUpdating || isSubmitting}
        className="m-0 border-0 border-t border-(--border-contrast-grey) bg-(--background-alt-grey) px-4 py-6"
      >
        <Tag className="mb-4 bg-(--background-action-high-blue-france)! px-3! py-1! text-sm! leading-6! font-normal text-(--text-inverted-blue-france)!">
          Note
        </Tag>
        <form.AppField name="note">
          {(field) => (
            <field.TextareaField
              label="Ajouter une note"
              hideOptionalLabel
              classes={{ label: 'sr-only' }}
              nativeTextAreaProps={{
                maxLength: 250,
                placeholder: 'Ajouter une note visible par votre équipe',
                required: false,
                rows: 3,
              }}
            />
          )}
        </form.AppField>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs leading-5" aria-live="polite">
            {note.length}/250
          </span>
          <form.SubmitButton priority="secondary" size="large" disabled={isUpdating || isSubmitting || !isDirty}>
            Ajouter au suivi
          </form.SubmitButton>
        </div>
      </fieldset>
    </Form>
  );
}

const getFollowUpDefaultValues = (demand: CcrtFollowUpFormProps['demand']) =>
  zCcrtFollowUpForm.parse({ note: '', projectState: demand.project_state, status: demand.status });
