import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import { useAuthentication } from '@/modules/auth/client/hooks';

import type { CcrtFollowUp } from '../types';
import { CcrtAccessUsers } from './CcrtAccessUsers';

type CcrtDemandAccessProps = { users: CcrtFollowUp['users']; onManageAccess?: () => void };

/**
 * Lists effective access holders; administrators keep the existing user-permission editor.
 */
export function CcrtDemandAccess({ users, onManageAccess }: CcrtDemandAccessProps) {
  const { hasRole } = useAuthentication();
  return (
    <section className="border-t border-(--border-default-grey) p-4">
      <Accordion small simple lazy label={`${users.length} personne${users.length === 1 ? ' a' : 's ont'} accès`}>
        <CcrtAccessUsers users={users} showDates={hasRole('admin')} />
        {hasRole('admin') && (
          <ul className="m-0 list-none space-y-3 p-0 text-sm">
            {users.map((user) => (
              <li key={user.id}>
                <Button
                  size="small"
                  priority="tertiary no outline"
                  linkProps={{ href: `/admin/users?userId=${user.id}`, onClick: onManageAccess }}
                >
                  Gérer les accès de {user.email}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Accordion>
    </section>
  );
}
