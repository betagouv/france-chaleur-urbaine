import PopoverTrigger, { Popover, PopoverContent } from '@/components/ui/Popover';
import Tag from '@/components/ui/Tag';

import type { CcrtDemand } from '../types';
import { CcrtAccessUsers } from './CcrtAccessUsers';
import { getCcrtAccessWarning } from './ccrt-workspace';

type CcrtDemandAccessColumnProps = { users: NonNullable<CcrtDemand['access_users']> };

/**
 * Shows access counts and activity without opening the building sheet.
 */
export function CcrtDemandAccessColumn({ users }: CcrtDemandAccessColumnProps) {
  const warning = getCcrtAccessWarning(users);
  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger aria-label="Voir les comptes ayant accès à cette demande" className="text-left">
          <Tag size="sm">CCRT ({users.length})</Tag>
        </PopoverTrigger>
        <PopoverContent className="max-w-[min(32rem,90vw)] p-4">
          <CcrtAccessUsers users={users} showDates />
        </PopoverContent>
      </Popover>
      {warning && (
        <p className="mb-0 text-sm text-(--text-default-warning)">
          <span aria-hidden className="fr-icon-warning-fill mr-1" />
          {warning}
        </p>
      )}
    </div>
  );
}
