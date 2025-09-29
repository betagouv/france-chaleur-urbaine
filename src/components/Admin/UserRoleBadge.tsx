import Badge from '@codegouvfr/react-dsfr/Badge';

import { type UserRole } from '@/types/enum/UserRole';
import { upperCaseFirstChar } from '@/utils/strings';

const roleConfig = {
  admin: {
    className: 'bg-destructive! text-white!',
  },
  demo: {
    className: 'bg-yellow-300! text-black!',
  },
  gestionnaire: {
    className: 'bg-purple-700! text-white!',
  },
  professionnel: {
    className: 'bg-[#0d49fb]! text-white!',
  },
  particulier: {
    className: 'bg-[#2ca892]! text-white!',
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
      {upperCaseFirstChar(role)}
    </Badge>
  );
};

export default UserRoleBadge;
