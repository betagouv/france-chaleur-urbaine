import Badge from '@codegouvfr/react-dsfr/Badge';

import type { DemandStatus } from '@/modules/demands/constants';
import { demandStatusDefault } from '@/modules/demands/constants';
import { upperCaseFirstChar } from '@/utils/strings';

const statusConfig: Record<
  DemandStatus,
  {
    className: string;
  }
> = {
  'En attente de prise en charge': {
    className: 'bg-gray-500! text-white!',
  },
  'En attente d’éléments du prospect': {
    className: 'bg-yellow-300! text-black!',
  },
  'Non réalisable': {
    className: 'bg-destructive! text-white!',
  },
  'Projet abandonné par le prospect': {
    className: 'bg-red-700! text-white!',
  },
  Réalisé: {
    className: 'bg-[#2ca892]! text-white!',
  },
  'Travaux en cours': {
    className: 'bg-indigo-500! text-white!',
  },
  'Voté en AG': {
    className: 'bg-purple-700! text-white!',
  },
  'Étude en cours': {
    className: 'bg-[#0d49fb]! text-white!',
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
