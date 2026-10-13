import { z } from 'zod';

import Dialog from '@/components/ui/Dialog';
import type { DialogControl } from '@/hooks/useDialogState';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';

export type RenameFileData = {
  filename: string;
  /** persists the new name; the dialog closes on success */
  onRename: (filename: string) => Promise<void>;
};

type RenameFileDialogProps = {
  control: DialogControl<RenameFileData>;
};

const zRenameForm = z.object({ filename: z.string().trim().min(1, 'Le nom est obligatoire').max(200) });

/** Renames a file of a request (for a document, the name shown and downloaded on the network page); the extension must stay. */
function RenameFileDialog({ control }: RenameFileDialogProps) {
  return (
    <Dialog {...control.dialogProps} title="Renommer le fichier" size="sm">
      {control.data && <RenameForm key={control.data.filename} data={control.data} onDone={control.close} />}
    </Dialog>
  );
}

type RenameFormProps = { data: RenameFileData; onDone: () => void };

function RenameForm({ data, onDone }: RenameFormProps) {
  const form = useAppForm({
    ...schemaValidation(zRenameForm),
    defaultValues: { filename: data.filename },
    onSubmit: toastErrors(async ({ value }) => {
      await data.onRename(value.filename);
      onDone();
    }),
  });
  return (
    <Form form={form}>
      <form.AppField name="filename">
        {(field) => <field.TextField label="Nom du fichier" hintText="L'extension doit rester la même" />}
      </form.AppField>
      <form.SubmitButton iconId="fr-icon-check-line">Renommer</form.SubmitButton>
    </Form>
  );
}

export default RenameFileDialog;
