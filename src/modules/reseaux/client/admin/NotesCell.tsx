import { useState } from 'react';

import TextAreaInput from '@/components/form/dsfr/TextArea';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';

type NotesCellProps = {
  initialNotes: string;
  onSave: (notes: string) => Promise<void>;
  /** Number of characters shown in the cell before the notes are truncated. */
  previewLength?: number;
};

/**
 * Table cell rendering a network's free-text notes in a modal editor with explicit save/cancel.
 * Shows a truncated preview in the cell and opens a large textarea dialog on edit.
 */
export function NotesCell({ initialNotes, onSave, previewLength = 150 }: NotesCellProps) {
  const [value, setValue] = useState(initialNotes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = () => {
    setValue(initialNotes);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (value !== initialNotes) {
      await onSave(value);
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} title="Notes" size="lg">
        <div className="flex flex-col gap-4">
          <TextAreaInput
            label=""
            className="w-full"
            nativeTextAreaProps={{
              autoFocus: true,
              onChange: (e) => setValue(e.target.value),
              rows: 20,
              value,
            }}
          />
          <div className="flex justify-end gap-2">
            <Button priority="secondary" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void handleSave()}>Enregistrer</Button>
          </div>
        </div>
      </Dialog>
      <div className="min-w-0 whitespace-pre-wrap wrap-break-word">
        {initialNotes.length > previewLength ? `${initialNotes.slice(0, previewLength)}...` : initialNotes}
      </div>
      <Button priority="tertiary" iconId="fr-icon-pencil-line" className="shrink-0" onClick={openDialog} />
    </>
  );
}
