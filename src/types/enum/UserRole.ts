export const userRoles = ['admin', 'gestionnaire', 'collectivite', 'alec', 'ccrt', 'particulier', 'professionnel'] as const;

export type UserRole = (typeof userRoles)[number];

export const userRolesInscription = ['particulier', 'professionnel'] as const satisfies UserRole[];
export type UserRoleInscription = (typeof userRolesInscription)[number];

export const userRolesWithPermissionsHeatNetwork = ['gestionnaire', 'collectivite', 'alec'] as const satisfies UserRole[];
export const userRolesWithPermissionsRenewableHeat = ['ccrt'] as const satisfies UserRole[];
export const userRolesWithPermissions = [...userRolesWithPermissionsHeatNetwork, ...userRolesWithPermissionsRenewableHeat] as const;
