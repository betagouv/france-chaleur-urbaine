export const userRoles = ['admin', 'gestionnaire', 'collectivite', 'alec', 'ccrt', 'particulier', 'professionnel'] as const;

export type UserRole = (typeof userRoles)[number];

export const userRolesInscription = ['particulier', 'professionnel'] as const satisfies UserRole[];

export const userRolesWithPermissions = ['gestionnaire', 'collectivite', 'alec', 'ccrt'] as const satisfies UserRole[];
