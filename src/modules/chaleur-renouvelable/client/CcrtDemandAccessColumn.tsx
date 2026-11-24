import AccessCountsCell from '@/modules/demands/client/AccessCountsCell';

import type { CcrtDemand } from '../types';
import { getCcrtAccessWarning } from './ccrt-workspace';

type CcrtDemandAccessColumnProps = { demandId: string; users: NonNullable<CcrtDemand['access_users']> };

/**
 * Shows access counts and activity without opening the building sheet.
 */
export function CcrtDemandAccessColumn({ demandId, users }: CcrtDemandAccessColumnProps) {
  const warning = getCcrtAccessWarning(users);
  return (
    <div className="space-y-2">
      <AccessCountsCell demandId={demandId} accessCounts={{ ccrt: users.length }} users={users} />
      {users.length > 0 && warning && (
        <p className="mb-0 text-sm text-(--text-default-warning)">
          <span aria-hidden className="fr-icon-warning-fill mr-1" />
          {warning}
        </p>
      )}
    </div>
  );
}
