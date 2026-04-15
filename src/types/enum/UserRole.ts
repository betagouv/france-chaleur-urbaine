export enum USER_ROLE {
  ADMIN = 'admin',
  GESTIONNAIRE = 'gestionnaire',
  COLLECTIVITE = 'collectivite',
  ALEC = 'alec',
  PARTICULIER = 'particulier',
  PROFESSIONNEL = 'professionnel',
}

export type UserRole = `${USER_ROLE}`;

export const userRoles = ['admin', 'gestionnaire', 'collectivite', 'alec', 'particulier', 'professionnel'] as const;

export const userRolesInscription = ['particulier', 'professionnel'] as const satisfies UserRole[];

export const userRolesWithPermissions = ['gestionnaire', 'collectivite', 'alec'] as const satisfies UserRole[];
