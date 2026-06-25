import Badge from '@codegouvfr/react-dsfr/Badge';

import type { DemandStatus } from '@/modules/demands/constants';
import { demandStatusDefault } from '@/modules/demands/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { upperCaseFirstChar } from '@/utils/strings';

const statusConfig: Record<
  DemandStatus,
  {
    className: string;
  }
> = {
  [DEMANDE_STATUS.TO_PROCESS]: {
    className: 'bg-red-600! text-white!',
  },
  [DEMANDE_STATUS.UNREALISABLE]: {
    className: 'bg-destructive! text-white!',
  },
  [DEMANDE_STATUS.RECONTACTED]: {
    className: 'bg-[#0d49fb]! text-white!',
  },
  [DEMANDE_STATUS.COMMERCIAL_PROPOSAL]: {
    className: 'bg-yellow-300! text-black!',
  },
  [DEMANDE_STATUS.VOTED]: {
    className: 'bg-purple-700! text-white!',
  },
  [DEMANDE_STATUS.WORK_IN_PROGRESS]: {
    className: 'bg-indigo-500! text-white!',
  },
  [DEMANDE_STATUS.DONE]: {
    className: 'bg-[#2ca892]! text-white!',
  },
  [DEMANDE_STATUS.ABANDONNED]: {
    className: 'bg-red-700! text-white!',
  },
};

type DemandStatusBadgeProps = {
  status: DemandStatus;
};

const DemandStatusBadge = ({ status }: DemandStatusBadgeProps) => {
  const config = statusConfig[status] ?? statusConfig[demandStatusDefault];
  return (
    <Badge small className={config.className}>
      {upperCaseFirstChar(status || demandStatusDefault)}
    </Badge>
  );
};

export default DemandStatusBadge;
