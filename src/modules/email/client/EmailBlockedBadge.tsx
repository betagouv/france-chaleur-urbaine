import Badge from '@/components/ui/Badge';
import { getEmailBlockReasonLabel } from '@/modules/email/constants';

import EmailUnblockButton from './EmailUnblockButton';

type EmailBlockedBadgeProps = {
  email: string;
  reasonCode: string;
  /** `xs` fits inside dense cells (e.g. user tags in the network stats table). */
  size?: 'sm' | 'xs';
  /** Called after a successful unblock, to refresh the list the badge lives in. */
  onUnblocked?: () => void | Promise<void>;
};

/**
 * Admin badge « Emails bloqués » (reason in tooltip) with the unblock shortcut next to it.
 * Used in the users, demands and network stats tables.
 */
function EmailBlockedBadge({ email, reasonCode, size = 'sm', onUnblocked }: EmailBlockedBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap break-normal">
      <Badge type="email_blocked" size={size} className="cursor-help" title={getEmailBlockReasonLabel(reasonCode)} />
      <EmailUnblockButton email={email} reasonCode={reasonCode} size={size} onUnblocked={onUnblocked} />
    </span>
  );
}

export default EmailBlockedBadge;
