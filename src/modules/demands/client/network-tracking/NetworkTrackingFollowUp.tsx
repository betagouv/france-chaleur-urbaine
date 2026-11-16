import type { ReactNode } from 'react';

import { NetworkTrackingNotesCell } from './NetworkTrackingNotesCell';
import { NetworkTrackingRemindersCell } from './NetworkTrackingRemindersCell';
import { NetworkTrackingUsersCell } from './NetworkTrackingUsersCell';
import type { NetworkTrackingSummary } from './types';

const NOTES_PREVIEW_LENGTH = 600;

type NetworkTrackingFollowUpProps = {
  network: NetworkTrackingSummary;
};

/**
 * Who to contact about a network and what was already done: accounts holding a permission, notes and the whole reminders history, editable in place.
 */
export function NetworkTrackingFollowUp({ network }: NetworkTrackingFollowUpProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <FollowUpCard title={`Utilisateurs ayant accès (${network.users.length})`}>
        <NetworkTrackingUsersCell network={network} />
      </FollowUpCard>
      <FollowUpCard title="Notes">
        <NetworkTrackingNotesCell network={network} previewLength={NOTES_PREVIEW_LENGTH} />
      </FollowUpCard>
      <FollowUpCard title={`Relances (${network.reminders.length})`}>
        <NetworkTrackingRemindersCell network={network} display="all" />
      </FollowUpCard>
    </div>
  );
}

type FollowUpCardProps = {
  title: string;
  children: ReactNode;
};

/**
 * Titled box of the follow-up section.
 */
function FollowUpCard({ title, children }: FollowUpCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs text-(--text-mention-grey)">{title}</div>
      {children}
    </div>
  );
}
