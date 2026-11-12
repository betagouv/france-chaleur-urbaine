export const userRoles = ['admin', 'gestionnaire', 'collectivite', 'alec', 'ccrt', 'professionnel'] as const;

export type UserRole = (typeof userRoles)[number];

// Removed roles still met in stored events (past admin impersonations).
export const retiredUserRoles = ['particulier'] as const;
export type StoredUserRole = UserRole | (typeof retiredUserRoles)[number];

export const userRolesInscription = ['professionnel'] as const satisfies UserRole[];
export type UserRoleInscription = (typeof userRolesInscription)[number];

export const userRolesWithPermissionsHeatNetwork = ['gestionnaire', 'collectivite', 'alec'] as const satisfies UserRole[];
export const userRolesWithPermissionsRenewableHeat = ['ccrt'] as const satisfies UserRole[];
export const userRolesWithPermissions = [...userRolesWithPermissionsHeatNetwork, ...userRolesWithPermissionsRenewableHeat] as const;
