import { NotesCell } from '@/modules/reseaux/client/admin/NotesCell';
import trpc from '@/modules/trpc/client';

import type { NetworkTrackingSummary } from './types';

const NOTES_PREVIEW_LENGTH = 60;

type NetworkTrackingNotesCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Free-text notes of a network, shortened in the tracking table and editable in a dialog.
 */
export function NetworkTrackingNotesCell({ network }: NetworkTrackingNotesCellProps) {
  const utils = trpc.useUtils();
  const { mutateAsync: updateNotes } = trpc.reseaux.networkReminders.updateNotes.useMutation({
    onSuccess: () => void utils.demands.admin.listNetworkTracking.invalidate(),
  });

  return (
    <div className="flex w-full items-center justify-between gap-1 text-sm">
      <NotesCell
        initialNotes={network.notes ?? ''}
        previewLength={NOTES_PREVIEW_LENGTH}
        onSave={async (notes) => {
          await updateNotes({ networkId: network.networkId, networkType: network.networkType, notes: notes.trim() || null });
        }}
      />
    </div>
  );
}
