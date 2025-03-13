export enum USER_ROLE {
  ADMIN = 'admin',
  GESTIONNAIRE = 'gestionnaire',
  PARTICULIER = 'particulier',
  PROFESSIONNEL = 'professionnel',
  DEMO = 'demo', // TODO à supprimer car remplacé par l'imposture
}

export type UserRole = `${USER_ROLE}`;

export const userRoles = ['admin', 'gestionnaire', 'particulier', 'professionnel', 'demo'] as const;

export const userRolesInscription = ['particulier', 'professionnel'] as const satisfies UserRole[];
