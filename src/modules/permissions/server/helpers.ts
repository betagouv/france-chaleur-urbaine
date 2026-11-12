import { type NetworkType, networkTypes } from '@/modules/reseaux/constants';
import { type UserRole, userRolesWithPermissionsHeatNetwork } from '@/types/enum/UserRole';

export const isNetworkPermissionType = (type: string): type is NetworkType => {
  return (networkTypes as readonly string[]).includes(type);
};

export const isOrganizationPermissionType = (type: string): type is 'organization' => type === 'organization';

export const isCustomTerritoryPermissionType = (type: string): type is 'custom_territory' => type === 'custom_territory';

export const isHeatNetworkDemandRole = (role: UserRole): boolean =>
  userRolesWithPermissionsHeatNetwork.some((allowedRole) => allowedRole === role);
