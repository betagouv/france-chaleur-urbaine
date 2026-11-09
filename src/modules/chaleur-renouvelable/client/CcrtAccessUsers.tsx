import Tag from '@/components/ui/Tag';
import { dayjs } from '@/utils/date';

import type { CcrtFollowUp } from '../types';

type CcrtAccessUsersProps = { users: CcrtFollowUp['users']; showDates?: boolean };

/**
 * Groups access holders under their role tag and exposes activity dates to admins.
 */
export function CcrtAccessUsers({ users, showDates = false }: CcrtAccessUsersProps) {
  const roles = [...new Set(users.map((user) => user.role))];
  return (
    <div className="space-y-3">
      {roles.map((role) => {
        const roleUsers = users.filter((user) => user.role === role);
        return (
          <div key={role}>
            <Tag size="sm">
              {roleLabels[role] ?? role} ({roleUsers.length})
            </Tag>
            <ul className="m-0 list-none space-y-2 p-0 text-sm">
              {roleUsers.map((user) => (
                <li key={user.id} className="break-words">
                  {(user.first_name || user.last_name) && (
                    <span className="block font-medium">{[user.first_name, user.last_name].filter(Boolean).join(' ')}</span>
                  )}
                  {user.structure_name && <span className="block">{user.structure_name}</span>}
                  <a className="break-all" href={`mailto:${user.email}`}>
                    {user.email}
                  </a>
                  {showDates && (
                    <span>
                      {' '}
                      ·{' '}
                      {user.last_connection
                        ? `Dernière connexion le ${dayjs(user.last_connection).tz('Europe/Paris').format('DD/MM/YYYY')}`
                        : 'Jamais connecté'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {users.length === 0 && <p className="mb-0 text-sm">Aucun compte CCRT n’a accès à cette demande.</p>}
    </div>
  );
}

const roleLabels: Record<string, string> = { alec: 'ALEC', ccrt: 'CCRT', collectivite: 'Collectivité', gestionnaire: 'Gestionnaire' };
