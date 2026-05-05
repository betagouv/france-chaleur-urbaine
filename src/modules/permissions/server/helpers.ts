import { type NetworkType, networkTypes } from '@/modules/reseaux/constants';
import { type UserRole, userRolesWithPermissions } from '@/types/enum/UserRole';

export const isNetworkPermissionType = (type: string): type is NetworkType => {
  return (networkTypes as readonly string[]).includes(type);
};

export const isRoleWithPermissions = (role: UserRole): boolean => {
  return (userRolesWithPermissions as readonly string[]).includes(role);
};
