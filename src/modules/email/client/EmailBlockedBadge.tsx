import Badge from '@/components/ui/Badge';
import { getEmailBlockReasonLabel } from '@/modules/email/constants';

import EmailUnblockButton from './EmailUnblockButton';

type EmailBlockedBadgeProps = {
  email: string;
  reasonCode: string;
  /** Called after a successful unblock, to refresh the list the badge lives in. */
  onUnblocked?: () => void | Promise<void>;
};

/**
 * Admin badge « Emails bloqués » (reason in tooltip) with the unblock shortcut next to it.
 * Used in the users and demands tables.
 */
function EmailBlockedBadge({ email, reasonCode, onUnblocked }: EmailBlockedBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <Badge type="email_blocked" className="cursor-help" title={getEmailBlockReasonLabel(reasonCode)} />
      <EmailUnblockButton email={email} reasonCode={reasonCode} onUnblocked={onUnblocked} />
    </span>
  );
}

export default EmailBlockedBadge;
