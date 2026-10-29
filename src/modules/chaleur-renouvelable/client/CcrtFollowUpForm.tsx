import { useStore } from '@tanstack/react-form';
import { useEffect, useState } from 'react';

import Tag from '@/components/ui/Tag';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';

import { demandeChaleurRenouvelableStatusOptions, zCcrtFollowUpForm } from '../constants';
import type { CcrtDemand, CcrtDemandUpdate } from '../types';

type CcrtFollowUpFormProps = {
  demand: Pick<CcrtDemand, 'status' | 'project_state'>;
  isUpdating: boolean;
  onUpdate: (values: CcrtDemandUpdate) => Promise<void>;
  onSaved: () => void;
};

/**
 * Autosaves follow-up selections while keeping note submission explicit and independent.
 */
export function CcrtFollowUpForm({ demand, isUpdating, onUpdate, onSaved }: CcrtFollowUpFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const defaultValues = getFollowUpDefaultValues(demand);
  const form = useAppForm({
    ...schemaValidation(zCcrtFollowUpForm),
    defaultValues,
    onSubmit: toastErrors(async ({ value }) => {
      if (!value.note.trim() || isSaving || isUpdating) {
        return;
      }
      await onUpdate({ note: value.note.trim() });
      form.resetField('note');
      onSaved();
    }),
  });
  const selectedStatus = useStore(form.store, (state) => state.values.status);
  const note = useStore(form.store, (state) => state.values.note);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  // Refresh saved selections independently so a drafted note survives background updates.
  useEffect(() => {
    form.setFieldValue('status', defaultValues.status, { dontRunListeners: true, dontUpdateMeta: true });
    form.setFieldValue('projectState', defaultValues.projectState, { dontRunListeners: true, dontUpdateMeta: true });
  }, [defaultValues.status, defaultValues.projectState, form]);

  const handleSelectionChange = toastErrors(async (values: CcrtDemandUpdate) => {
    setIsSaving(true);
    try {
      await onUpdate(values);
      onSaved();
    } catch (error) {
      form.setFieldValue('status', defaultValues.status, { dontRunListeners: true });
      form.setFieldValue('projectState', defaultValues.projectState, { dontRunListeners: true });
      throw error;
    } finally {
      setIsSaving(false);
    }
  });

  const isDisabled = isUpdating || isSubmitting || isSaving;

  return (
    <Form form={form} className="[&_.fr-label]:text-sm [&_.fr-label]:leading-6 [&_.fr-label]:text-(--text-default-grey)">
      <fieldset disabled={isDisabled} className="m-0 border-0 px-4 pb-4 pt-0">
        <form.AppField name="status" listeners={{ onChange: ({ value }) => void handleSelectionChange({ status: value }) }}>
          {(field) => (
            <field.SelectField
              label="Où en êtes-vous du suivi de la demande ?"
              hideOptionalLabel
              options={demandeChaleurRenouvelableStatusOptions}
            />
          )}
        </form.AppField>
      </fieldset>
      {isSaving && (
        <p role="status" className="px-4 text-sm">
          Enregistrement du suivi…
        </p>
      )}
      <fieldset
        disabled={isDisabled}
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
          <form.SubmitButton priority="secondary" size="large" disabled={isDisabled || !note.trim()}>
            Ajouter au suivi
          </form.SubmitButton>
        </div>
      </fieldset>
    </Form>
  );
}

const getFollowUpDefaultValues = (demand: CcrtFollowUpFormProps['demand']) =>
  zCcrtFollowUpForm.parse({ note: '', projectState: demand.project_state, status: demand.status });
