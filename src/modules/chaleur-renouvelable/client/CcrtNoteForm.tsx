import { useStore } from '@tanstack/react-form';
import { useRef } from 'react';

import Button from '@/components/ui/Button';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { zCcrtNote } from '../constants';
import type { CcrtNote } from '../types';

type CcrtNoteFormProps = { demandId: string; note?: CcrtNote; onSaved?: () => void };

/**
 * Adds or edits a shared note with the design's character counter and explicit save action.
 */
export function CcrtNoteForm({ demandId, note, onSaved }: CcrtNoteFormProps) {
  const updatedAt = useRef(note?.updated_at);
  const utils = trpc.useUtils();
  const create = trpc.batEnr.ccrt.createNote.useMutation();
  const update = trpc.batEnr.ccrt.updateNote.useMutation();
  const form = useAppForm({
    ...schemaValidation(zCcrtNote),
    defaultValues: { body: note?.body ?? '' },
    onSubmit: toastErrors(async ({ value }) => {
      if (note) {
        await update.mutateAsync({ ...value, demandId, noteId: note.id, updatedAt: updatedAt.current ?? note.updated_at });
      } else {
        await create.mutateAsync({ ...value, demandId });
      }
      form.reset();
      await utils.batEnr.ccrt.getFollowUp.invalidate({ demandId });
      onSaved?.();
    }),
  });
  const body = useStore(form.store, (state) => state.values.body);
  const isPending = create.isPending || update.isPending;
  return (
    <Form form={form}>
      <form.AppField name="body">
        {(field) => (
          <field.TextareaField
            label={note ? 'Modifier la note' : 'Ajouter une note'}
            nativeTextAreaProps={{
              disabled: isPending,
              maxLength: 250,
              placeholder: 'Ajouter une note visible par les personnes ayant accès à cette demande',
              rows: 3,
            }}
          />
        )}
      </form.AppField>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs" aria-live="polite">
          {body.length}/250
        </span>
        <form.SubmitButton priority="secondary" size="small" disabled={isPending}>
          {note ? 'Enregistrer' : 'Ajouter au suivi'}
        </form.SubmitButton>
        {note && (
          <Button priority="tertiary no outline" size="small" disabled={isPending} onClick={onSaved}>
            Annuler
          </Button>
        )}
      </div>
    </Form>
  );
}
