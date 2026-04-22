import type { NetworkType } from '@/modules/reseaux/constants';
import { type UserRole, userRolesWithPermissions } from '@/types/enum/UserRole';

import { type NetworkPermissionType, networkPermissionTypes } from '../types';

/**
 * Maps permission type to the network_type value stored on demands.
 */
export const permissionTypeToNetworkType: Record<NetworkPermissionType, NetworkType> = {
  reseau_en_construction: 'en_construction',
  reseau_existant: 'existant',
};

export const networkTypeToPermissionType: Record<NetworkType, NetworkPermissionType> = {
  en_construction: 'reseau_en_construction',
  existant: 'reseau_existant',
};

export const isNetworkPermissionType = (type: string): type is NetworkPermissionType => {
  return (networkPermissionTypes as readonly string[]).includes(type);
};

export const isRoleWithPermissions = (role: UserRole): boolean => {
  return (userRolesWithPermissions as readonly string[]).includes(role);
};
