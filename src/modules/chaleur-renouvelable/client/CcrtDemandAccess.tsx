import Accordion from '@/components/ui/Accordion';
import { useAuthentication } from '@/modules/auth/client/hooks';

import type { CcrtFollowUp } from '../types';
import { CcrtAccessUsers } from './CcrtAccessUsers';

type CcrtDemandAccessProps = { users: CcrtFollowUp['users'] };

/**
 * Lists effective access holders; administrators keep the existing user-permission editor.
 */
export function CcrtDemandAccess({ users }: CcrtDemandAccessProps) {
  const { hasRole } = useAuthentication();
  return (
    <section className="border-t border-(--border-default-grey) p-4">
      <Accordion small simple lazy label={`${users.length} personne${users.length === 1 ? ' a' : 's ont'} accès`}>
        <CcrtAccessUsers users={users} showDates={hasRole('admin')} />
      </Accordion>
    </section>
  );
}
