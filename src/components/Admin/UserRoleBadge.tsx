import Badge from '@codegouvfr/react-dsfr/Badge';

import { roles } from '@/modules/users/constants';
import type { UserRole } from '@/types/enum/UserRole';

const roleConfig = {
  admin: {
    className: 'bg-destructive! text-white!',
  },
  alec: {
    className: 'bg-teal-600! text-white!',
  },
  collectivite: {
    className: 'bg-orange-600! text-white!',
  },
  gestionnaire: {
    className: 'bg-purple-700! text-white!',
  },
  particulier: {
    className: 'bg-[#2ca892]! text-white!',
  },
  professionnel: {
    className: 'bg-[#0d49fb]! text-white!',
  },
} satisfies Record<
  UserRole,
  {
    className: string;
  }
>;

type UserRoleBadgeProps = {
  role: UserRole;
};

const UserRoleBadge = ({ role }: UserRoleBadgeProps) => {
  const config = roleConfig[role];
  return (
    <Badge small className={config.className}>
      {roles[role]}
    </Badge>
  );
};

export default UserRoleBadge;
