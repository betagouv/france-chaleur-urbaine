import { notify } from '@/modules/notification';
import { RemindersCell } from '@/modules/reseaux/client/admin/RemindersCell';
import trpc from '@/modules/trpc/client';

import type { NetworkTrackingSummary } from './types';
import { useNetworkTrackingRefresh } from './useNetworkTrackingRefresh';

type NetworkTrackingRemindersCellProps = {
  network: NetworkTrackingSummary;
  /** Dense rendering for the table; the detail page shows the latest reminder in full. */
  compact?: boolean;
};

/**
 * Reminders an admin logged when chasing the managers of a network, editable in place.
 */
export function NetworkTrackingRemindersCell({ network, compact = true }: NetworkTrackingRemindersCellProps) {
  const refreshTracking = useNetworkTrackingRefresh();
  const refresh = (message: string) => () => {
    void refreshTracking();
    notify('success', message);
  };
  const { mutateAsync: createReminder } = trpc.reseaux.networkReminders.create.useMutation({ onSuccess: refresh('Relance enregistrée') });
  const { mutateAsync: updateReminder } = trpc.reseaux.networkReminders.update.useMutation({ onSuccess: refresh('Relance mise à jour') });
  const { mutateAsync: deleteReminder } = trpc.reseaux.networkReminders.delete.useMutation({ onSuccess: refresh('Relance supprimée') });

  return (
    <RemindersCell
      compact={compact}
      reminders={network.reminders}
      onCreateReminder={(note, createdAt) =>
        createReminder({ createdAt, networkId: network.networkId, networkType: network.networkType, note, type: 'demand' })
      }
      onUpdateReminder={(id, changes) => updateReminder({ createdAt: changes.createdAt, id, note: changes.note })}
      onDeleteReminder={(id) => deleteReminder({ id })}
    />
  );
}
