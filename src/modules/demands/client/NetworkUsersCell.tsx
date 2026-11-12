import Tag from '@codegouvfr/react-dsfr/Tag';

import Button from '@/components/ui/Button';
import { useCopy } from '@/components/ui/ButtonCopy';
import Icon from '@/components/ui/Icon';
import TimeAgo from '@/components/ui/TimeAgo';
import Tooltip from '@/components/ui/Tooltip';
import EmailBlockedBadge from '@/modules/email/client/EmailBlockedBadge';
import { notify } from '@/modules/notification';
import cx from '@/utils/cx';

export type NetworkUser = {
  id: string;
  email: string;
  last_connection: string | null;
  email_blocked_reason: string | null;
};

type NetworkUsersCellProps = {
  users: NetworkUser[];
  /** Called after an address is unblocked, to refresh the list the cell lives in. */
  onEmailUnblocked: () => void | Promise<void>;
};

/**
 * Accounts holding a permission on a network: email, last connection, blocked-email badge, and a button copying all the addresses.
 */
export function NetworkUsersCell({ users, onEmailUnblocked }: NetworkUsersCellProps) {
  if (users.length === 0) {
    return <span className="text-gray-400 text-sm">Aucun utilisateur</span>;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {users.map((user) => {
          const lastConnectionClassName = getLastConnectionClassName(user.last_connection);
          return (
            <Tag as="span" key={user.id} className="bg-gray-100 text-gray-800">
              <div className="flex flex-col leading-tight break-all text-xs">
                <span>{user.email}</span>
                <span className="inline-flex flex-wrap items-center gap-x-1 whitespace-nowrap">
                  {user.last_connection ? (
                    <TimeAgo
                      date={user.last_connection}
                      className={cx(lastConnectionClassName)}
                      prefix={<Icon name="fr-icon-time-line" size="xs" className="mr-1" title="Dernière connexion" />}
                    />
                  ) : (
                    <span className={cx(lastConnectionClassName)}>
                      <Icon name="fr-icon-time-line" size="xs" className="mr-1" title="Dernière connexion" />
                      Jamais connecté
                    </span>
                  )}
                  {user.email_blocked_reason && (
                    <EmailBlockedBadge email={user.email} reasonCode={user.email_blocked_reason} size="xs" onUnblocked={onEmailUnblocked} />
                  )}
                </span>
              </div>
            </Tag>
          );
        })}
      </div>
      <CopyEmailsButton emails={users.map((user) => user.email)} />
    </div>
  );
}

const getLastConnectionClassName = (value: string | null | undefined) => {
  if (!value) return 'text-error';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'text-error';
  const diffInDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffInDays <= 30) return 'text-success';
  if (diffInDays <= 90) return 'text-orange-600';
  return 'text-error';
};

type CopyEmailsButtonProps = {
  emails: string[];
};

/**
 * Button copying a list of email addresses to the clipboard.
 */
function CopyEmailsButton({ emails }: CopyEmailsButtonProps) {
  const { copied, copy } = useCopy();
  return (
    <Tooltip title="Copier les adresses e-mail dans le presse-papiers">
      <Button
        type="button"
        className="inline-flex items-center gap-1 text-sm"
        onClick={() => {
          copy(emails.join(', '));
          notify('success', 'Adresses copiées !');
        }}
        iconId={copied ? 'ri-check-line' : 'fr-icon-clipboard-line'}
        priority="tertiary no outline"
        size="small"
      >
        {copied ? 'Copié !' : 'Copier les adresses'}
      </Button>
    </Tooltip>
  );
}
