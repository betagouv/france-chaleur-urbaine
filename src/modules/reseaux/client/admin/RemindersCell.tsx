import dayjs from 'dayjs';
import { useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import TimeAgo from '@/components/ui/TimeAgo';
import type { NetworkReminderListItem } from '@/modules/reseaux/server/reminders';

type ReminderDialogState = { mode: 'create' } | { mode: 'edit'; id: string; note: string; createdAt: string } | null;

type RemindersCellProps = {
  reminders: NetworkReminderListItem[];
  onCreateReminder: (note: string | null, createdAt: string) => Promise<unknown>;
  onUpdateReminder: (id: string, changes: { note: string | null; createdAt: string }) => Promise<unknown>;
  onDeleteReminder: (id: string) => Promise<unknown>;
};

/**
 * Table cell rendering the list of reminders for a network with inline edit/delete actions.
 * Exposes a single dialog used for both creating new reminders and editing existing ones.
 */
export function RemindersCell({ reminders, onCreateReminder, onUpdateReminder, onDeleteReminder }: RemindersCellProps) {
  const [dialog, setDialog] = useState<ReminderDialogState>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [note, setNote] = useState('');
  const [reminderDate, setReminderDate] = useState(() => dayjs().format('YYYY-MM-DD'));

  const latest = reminders[0];
  const extraCount = Math.max(0, reminders.length - 1);

  const openCreateDialog = () => {
    setNote('');
    setReminderDate(dayjs().format('YYYY-MM-DD'));
    setDialog({ mode: 'create' });
  };

  const openEditDialog = (reminder: NetworkReminderListItem) => {
    setNote(reminder.note ?? '');
    setReminderDate(dayjs(reminder.created_at).format('YYYY-MM-DD'));
    setHistoryOpen(false);
    setDialog({ createdAt: reminder.created_at, id: reminder.id, mode: 'edit', note: reminder.note ?? '' });
  };

  const handleSubmit = async () => {
    const trimmed = note.trim() || null;
    const timeRef = dialog?.mode === 'edit' ? dayjs(dialog.createdAt) : dayjs();
    const createdAt = dayjs(`${reminderDate}T${timeRef.format('HH:mm:ss.SSS')}`).toISOString();
    if (dialog?.mode === 'edit') {
      await onUpdateReminder(dialog.id, { createdAt, note: trimmed });
    } else {
      await onCreateReminder(trimmed, createdAt);
    }
    setDialog(null);
  };

  const handleDelete = async (reminder: NetworkReminderListItem) => {
    const label = reminder.note
      ? `"${reminder.note.slice(0, 60)}${reminder.note.length > 60 ? '...' : ''}"`
      : `du ${dayjs(reminder.created_at).format('DD/MM/YYYY')}`;
    if (!window.confirm(`Supprimer la relance ${label} ?`)) return;
    await onDeleteReminder(reminder.id);
  };

  const renderReminderItem = (reminder: NetworkReminderListItem, { withActions }: { withActions: boolean }) => (
    <div key={reminder.id} className="text-xs border-l-2 border-blue-400 pl-2 py-0.5">
      <div className="flex items-start gap-2">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1 font-medium text-gray-700">
            <Icon name="fr-icon-calendar-line" size="xs" className="text-gray-400" />
            <TimeAgo date={reminder.created_at} />
          </div>
          {reminder.author_email && (
            <div className="flex items-center gap-1 text-gray-400 text-[11px] my-1">
              <Icon name="fr-icon-user-line" size="xs" />
              {reminder.author_email}
            </div>
          )}
        </div>
        {withActions && (
          <div className="flex items-center shrink-0">
            <Button
              priority="tertiary no outline"
              size="small"
              iconId="fr-icon-pencil-line"
              title="Modifier la relance"
              onClick={() => openEditDialog(reminder)}
            />
            <Button
              priority="tertiary no outline"
              size="small"
              iconId="fr-icon-delete-line"
              title="Supprimer la relance"
              onClick={() => void handleDelete(reminder)}
            />
          </div>
        )}
      </div>
      {reminder.note && <div className="text-gray-500 italic whitespace-pre-wrap text-[13px]">{reminder.note}</div>}
    </div>
  );

  return (
    <div className="flex flex-col gap-1 w-full">
      {latest && renderReminderItem(latest, { withActions: true })}
      {extraCount > 0 && (
        <Button priority="tertiary no outline" size="small" onClick={() => setHistoryOpen(true)}>
          Voir l'historique ({reminders.length})
        </Button>
      )}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen} title={`Historique des relances (${reminders.length})`} size="md">
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {reminders.map((reminder) => renderReminderItem(reminder, { withActions: true }))}
        </div>
      </Dialog>
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
            label="Note"
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
