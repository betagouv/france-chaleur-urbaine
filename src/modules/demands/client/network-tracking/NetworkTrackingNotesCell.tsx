import { NotesCell } from '@/modules/reseaux/client/admin/NotesCell';
import trpc from '@/modules/trpc/client';

import type { NetworkTrackingSummary } from './types';
import { useNetworkTrackingRefresh } from './useNetworkTrackingRefresh';

const NOTES_PREVIEW_LENGTH = 60;

type NetworkTrackingNotesCellProps = {
  network: NetworkTrackingSummary;
  /** Number of characters shown before the notes are truncated: short in the table, longer on the detail page. */
  previewLength?: number;
};

/**
 * Free-text notes of a network, shortened to fit where they are shown and editable in a dialog.
 */
export function NetworkTrackingNotesCell({ network, previewLength = NOTES_PREVIEW_LENGTH }: NetworkTrackingNotesCellProps) {
  const refresh = useNetworkTrackingRefresh();
  const { mutateAsync: updateNotes } = trpc.reseaux.networkReminders.updateNotes.useMutation({
    onSuccess: () => void refresh(),
  });

  return (
    <div className="flex w-full items-center justify-between gap-1 text-sm">
      <NotesCell
        initialNotes={network.notes ?? ''}
        previewLength={previewLength}
        onSave={async (notes) => {
          await updateNotes({ networkId: network.networkId, networkType: network.networkType, notes: notes.trim() || null });
        }}
      />
    </div>
  );
}
