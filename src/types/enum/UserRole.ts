export const userRoles = ['admin', 'gestionnaire', 'collectivite', 'alec', 'ccrt', 'particulier', 'professionnel'] as const;

export type UserRole = (typeof userRoles)[number];

// particulier accounts are being phased out: demands are tracked by email without an account
export const userRolesInscription = ['professionnel'] as const satisfies UserRole[];
export type UserRoleInscription = (typeof userRolesInscription)[number];

export const userRolesWithPermissionsHeatNetwork = ['gestionnaire', 'collectivite', 'alec'] as const satisfies UserRole[];
export const userRolesWithPermissionsRenewableHeat = ['ccrt'] as const satisfies UserRole[];
export const userRolesWithPermissions = [...userRolesWithPermissionsHeatNetwork, ...userRolesWithPermissionsRenewableHeat] as const;
