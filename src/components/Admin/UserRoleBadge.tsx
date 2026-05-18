import Badge from '@codegouvfr/react-dsfr/Badge';

import { roles } from '@/modules/users/constants';
import { roleBadgeClasses } from '@/modules/users/role-colors';
import type { UserRole } from '@/types/enum/UserRole';

type UserRoleBadgeProps = {
  role: UserRole;
};

const UserRoleBadge = ({ role }: UserRoleBadgeProps) => (
  <Badge small className={roleBadgeClasses[role]}>
    {roles[role]}
  </Badge>
);

export default UserRoleBadge;
