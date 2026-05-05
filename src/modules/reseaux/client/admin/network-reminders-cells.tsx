import dayjs from 'dayjs';
import { useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import TextAreaInput from '@/components/form/dsfr/TextArea';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import TimeAgo from '@/components/ui/TimeAgo';
import type { NetworkReminderListItem } from '@/modules/reseaux/server/reminders';

export type { NetworkReminderListItem };

type ReminderDialogState = { mode: 'create' } | { mode: 'edit'; id: string; note: string; createdAt: string } | null;

/**
 * Table cell rendering the list of reminders for a network with inline edit/delete actions.
 * Exposes a single dialog used for both creating new reminders and editing existing ones.
 */
export function RemindersCell({
  reminders,
  onCreateReminder,
  onUpdateReminder,
  onDeleteReminder,
}: {
  reminders: NetworkReminderListItem[];
  onCreateReminder: (note: string | null, createdAt: string) => Promise<unknown>;
  onUpdateReminder?: (id: string, changes: { note: string | null; createdAt: string }) => Promise<unknown>;
  onDeleteReminder?: (id: string) => Promise<unknown>;
}) {
  const [dialog, setDialog] = useState<ReminderDialogState>(null);
  const [note, setNote] = useState('');
  const [reminderDate, setReminderDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [expanded, setExpanded] = useState(false);

  const displayed = expanded ? reminders : reminders.slice(0, 2);
  const hasMore = reminders.length > 2;

  const openCreateDialog = () => {
    setNote('');
    setReminderDate(dayjs().format('YYYY-MM-DD'));
    setDialog({ mode: 'create' });
  };

  const openEditDialog = (r: NetworkReminderListItem) => {
    setNote(r.note ?? '');
    setReminderDate(dayjs(r.created_at).format('YYYY-MM-DD'));
    setDialog({ createdAt: r.created_at, id: r.id, mode: 'edit', note: r.note ?? '' });
  };

  const handleSubmit = async () => {
    const trimmed = note.trim() || null;
    if (dialog?.mode === 'edit' && onUpdateReminder) {
      await onUpdateReminder(dialog.id, { createdAt: reminderDate, note: trimmed });
    } else {
      await onCreateReminder(trimmed, reminderDate);
    }
    setDialog(null);
  };

  const handleDelete = async (r: NetworkReminderListItem) => {
    if (!onDeleteReminder) return;
    const label = r.note ? `"${r.note.slice(0, 60)}${r.note.length > 60 ? '...' : ''}"` : `du ${dayjs(r.created_at).format('DD/MM/YYYY')}`;
    if (!window.confirm(`Supprimer la relance ${label} ?`)) return;
    await onDeleteReminder(r.id);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {displayed.map((r) => (
        <div key={r.id} className="text-xs border-l-2 border-blue-400 pl-2 py-0.5 group">
          <div className="flex items-center gap-1 font-medium text-gray-700">
            <Icon name="fr-icon-calendar-line" size="xs" className="text-gray-400" />
            <TimeAgo date={r.created_at} />
            <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              {onUpdateReminder && (
                <Button
                  type="button"
                  priority="tertiary no outline"
                  size="small"
                  iconId="fr-icon-pencil-line"
                  title="Modifier la relance"
                  onClick={() => openEditDialog(r)}
                />
              )}
              {onDeleteReminder && (
                <Button
                  type="button"
                  priority="tertiary no outline"
                  size="small"
                  iconId="fr-icon-delete-line"
                  title="Supprimer la relance"
                  onClick={() => void handleDelete(r)}
                />
              )}
            </div>
          </div>
          {r.author_email && <div className="text-gray-400 text-[11px]">@{r.author_email}</div>}
          {r.note && <div className="text-gray-500 italic whitespace-pre-wrap mt-0.5">{r.note}</div>}
        </div>
      ))}
      {hasMore && !expanded && (
        <button type="button" className="text-xs text-blue-600 hover:underline text-left" onClick={() => setExpanded(true)}>
          + {reminders.length - 2} autre{reminders.length - 2 > 1 ? 's' : ''}
        </button>
      )}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.mode === 'edit' ? 'Modifier la relance' : 'Nouvelle relance'}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Date de la relance"
            nativeInputProps={{
              onChange: (e) => setReminderDate(e.target.value),
              type: 'date',
              value: reminderDate,
            }}
          />
          <Input
            label="Note (optionnelle)"
            nativeInputProps={{
              onChange: (e) => setNote(e.target.value),
              placeholder: 'Ex: relancé par email le...',
              value: note,
            }}
          />
          <div className="flex justify-end gap-2">
            <Button priority="secondary" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button onClick={() => void handleSubmit()}>{dialog?.mode === 'edit' ? 'Enregistrer' : 'Créer la relance'}</Button>
          </div>
        </div>
      </Dialog>
      <Button
        type="button"
        priority="tertiary no outline"
        size="small"
        iconId="fr-icon-calendar-line"
        title="Ajouter une relance"
        onClick={openCreateDialog}
      >
        Relancer
      </Button>
    </div>
  );
}

/**
 * Table cell rendering a network's free-text notes in a modal editor with explicit save/cancel.
 * Shows a truncated preview in the cell and opens a large textarea dialog on edit.
 */
export function NotesCell({ initialNotes, onSave }: { initialNotes: string; onSave: (notes: string) => Promise<void> }) {
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
            className="w-full [&>textarea]:leading-4!"
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
      <div className="whitespace-pre-wrap">{initialNotes.length > 150 ? `${initialNotes.slice(0, 150)}...` : initialNotes}</div>
      <Button priority="tertiary" iconId="fr-icon-pencil-line" onClick={openDialog} />
    </>
  );
}
