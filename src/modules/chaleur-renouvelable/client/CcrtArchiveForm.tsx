import { useStore } from '@tanstack/react-form';
import type { z } from 'zod';

import Button from '@/components/ui/Button';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { ccrtArchiveReasons, zCcrtArchiveDemand, zCcrtArchiveForm } from '../constants';
import { invalidateCcrtModeration } from './ccrt-demand-cache';

type CcrtArchiveFormProps = { demandId: string; onClose: () => void };

/**
 * Requires a reason and lets the admin suppress the user email for tests and duplicates.
 */
export function CcrtArchiveForm({ demandId, onClose }: CcrtArchiveFormProps) {
  const archive = trpc.batEnr.admin.archiveDemand.useMutation();
  const utils = trpc.useUtils();
  const defaultValues: z.input<typeof zCcrtArchiveForm> = { comment: '', reason: '', sendEmail: true };
  const form = useAppForm({
    ...schemaValidation(zCcrtArchiveForm),
    defaultValues,
    onSubmit: toastErrors(async ({ value }) => {
      await archive.mutateAsync(zCcrtArchiveDemand.parse({ ...value, demandId }));
      await invalidateCcrtModeration(utils, demandId);
      onClose();
    }),
  });
  const reason = useStore(form.store, (state) => state.values.reason);
  return (
    <Form form={form}>
      <form.AppField name="reason">
        {(field) => (
          <field.SelectField label="Motif d’archivage" options={[{ label: 'Choisissez un motif', value: '' }, ...ccrtArchiveReasons]} />
        )}
      </form.AppField>
      {reason === 'other' && <form.AppField name="comment">{(field) => <field.TextareaField label="Précision" />}</form.AppField>}
      <form.AppField name="sendEmail">{(field) => <field.CheckboxField label="Envoyer l’email à l’usager" />}</form.AppField>
      <p className="text-sm">La demande sera archivée et ne sera pas transmise aux CCRT. L’email oriente l’usager vers France Rénov’.</p>
      <div className="flex flex-wrap gap-3">
        <form.SubmitButton>Archiver la demande</form.SubmitButton>
        <Button priority="tertiary" disabled={archive.isPending} onClick={onClose}>
          Annuler
        </Button>
      </div>
    </Form>
  );
}
