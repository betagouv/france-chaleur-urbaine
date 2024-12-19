import Badge from '@codegouvfr/react-dsfr/Badge';

import { type UserRole } from '@/types/enum/UserRole';
import { upperCaseFirstChar } from '@/utils/strings';

const roleToColor = {
  admin: {
    backgroundColor: '#e31717',
    color: '#fff',
  },
  demo: {
    backgroundColor: '#e0eb26',
    color: '#000',
  },
  gestionnaire: {
    backgroundColor: '#7a00fb',
    color: '#fff',
  },
  professionnel: {
    backgroundColor: '#0d49fb',
    color: '#fff',
  },
} satisfies Record<
  UserRole,
  {
    backgroundColor: string;
    color: string;
  }
>;

type UserRoleBadgeProps = {
  role: UserRole;
};
const UserRoleBadge = ({ role }: UserRoleBadgeProps) => {
  return (
    <Badge small style={roleToColor[role]}>
      {upperCaseFirstChar(role)}
    </Badge>
  );
};

export default UserRoleBadge;
