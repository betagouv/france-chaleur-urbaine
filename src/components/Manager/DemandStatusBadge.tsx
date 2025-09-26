import Badge from '@codegouvfr/react-dsfr/Badge';

import { DEMANDE_STATUS, type DemandStatus } from '@/types/enum/DemandSatus';
import { upperCaseFirstChar } from '@/utils/strings';

const statusConfig = {
  [DEMANDE_STATUS.EMPTY]: {
    className: 'bg-gray-500! text-white!',
  },
  [DEMANDE_STATUS.UNREALISABLE]: {
    className: 'bg-destructive! text-white!',
  },
  [DEMANDE_STATUS.WAITING]: {
    className: 'bg-yellow-300! text-black!',
  },
  [DEMANDE_STATUS.IN_PROGRESS]: {
    className: 'bg-[#0d49fb]! text-white!',
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
} satisfies Record<
  DemandStatus,
  {
    className: string;
  }
>;

type DemandStatusBadgeProps = {
  status: DemandStatus;
};

const DemandStatusBadge = ({ status }: DemandStatusBadgeProps) => {
  const config = statusConfig[status] ?? statusConfig[DEMANDE_STATUS.EMPTY];
  return (
    <Badge small className={config.className}>
      {upperCaseFirstChar(status || DEMANDE_STATUS.EMPTY)}
    </Badge>
  );
};

export default DemandStatusBadge;
