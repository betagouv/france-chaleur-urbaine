import type { ReactNode } from 'react';

import Tooltip from '@/components/ui/Tooltip';

import { managersTooltip, NetworkTrackingManagersCell } from './NetworkTrackingManagersCell';
import { NetworkTrackingNotesCell } from './NetworkTrackingNotesCell';
import { NetworkTrackingOrganization } from './NetworkTrackingOrganization';
import { NetworkTrackingRemindersCell } from './NetworkTrackingRemindersCell';
import type { NetworkTrackingDetail } from './types';

const NOTES_PREVIEW_LENGTH = 600;

type NetworkTrackingFollowUpProps = {
  network: NetworkTrackingDetail['summary'];
  organization: NetworkTrackingDetail['organization'];
};

/**
 * Who to contact about a network and what was already done: its managers, its organization with its accounts,
 * notes and the whole reminders history, editable in place.
 */
export function NetworkTrackingFollowUp({ network, organization }: NetworkTrackingFollowUpProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-4">
        <FollowUpCard title={`Gestionnaires (${network.managers.length})`} tooltip={managersTooltip}>
          <NetworkTrackingManagersCell network={network} />
        </FollowUpCard>
        {organization && (
          <FollowUpCard title={`Organisation (${organization.users.length} ${organization.users.length > 1 ? 'comptes' : 'compte'})`}>
            <NetworkTrackingOrganization organization={organization} />
          </FollowUpCard>
        )}
      </div>
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
  tooltip?: string;
  children: ReactNode;
};

/**
 * Titled box of the follow-up section.
 */
function FollowUpCard({ title, tooltip, children }: FollowUpCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-1 text-xs text-(--text-mention-grey)">
        {title}
        {tooltip && <Tooltip title={tooltip} />}
      </div>
      {children}
    </div>
  );
}
