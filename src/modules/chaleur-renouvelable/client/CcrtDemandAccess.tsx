import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import { useAuthentication } from '@/modules/auth/client/hooks';

import type { CcrtFollowUp } from '../types';

type CcrtDemandAccessProps = { users: CcrtFollowUp['users']; onManageAccess?: () => void };

/**
 * Lists effective access holders; administrators keep the existing user-permission editor.
 */
export function CcrtDemandAccess({ users, onManageAccess }: CcrtDemandAccessProps) {
  const { hasRole } = useAuthentication();
  return (
    <section className="border-t border-(--border-default-grey) p-4">
      <Accordion small simple lazy label={`${users.length} personne${users.length === 1 ? ' a' : 's ont'} accès`}>
        <ul className="m-0 list-none space-y-3 p-0 text-sm">
          {users.map((user) => (
            <li key={user.id}>
              <span className="font-medium">{[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}</span>
              <span className="block">{user.structure_name || roleLabels[user.role]}</span>
              {hasRole('admin') && (
                <Button
                  size="small"
                  priority="tertiary no outline"
                  linkProps={{ href: `/admin/users?userId=${user.id}`, onClick: onManageAccess }}
                >
                  Gérer les accès
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Accordion>
    </section>
  );
}

const roleLabels: Record<string, string> = {
  admin: 'Administration FCU',
  alec: 'ALEC',
  ccrt: 'CCRT',
  collectivite: 'Collectivité',
  gestionnaire: 'Gestionnaire',
};
