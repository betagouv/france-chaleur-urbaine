import Badge from '@codegouvfr/react-dsfr/Badge';

import { storedRoleLabels } from '@/modules/users/constants';
import { roleBadgeClasses } from '@/modules/users/role-colors';
import type { StoredUserRole } from '@/types/enum/UserRole';

type UserRoleBadgeProps = {
  role: StoredUserRole;
};

const UserRoleBadge = ({ role }: UserRoleBadgeProps) => (
  <Badge small className={roleBadgeClasses[role]}>
    {storedRoleLabels[role]}
  </Badge>
);

export default UserRoleBadge;
