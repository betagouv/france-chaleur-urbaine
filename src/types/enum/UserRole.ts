export enum USER_ROLE {
  ADMIN = 'admin',
  GESTIONNAIRE = 'gestionnaire',
  PROFESSIONNEL = 'professionnel',
  DEMO = 'demo', // TODO à supprimer car remplacé par l'imposture
}

export type UserRole = `${USER_ROLE}`;

export const userRoles = ['admin', 'gestionnaire', 'professionnel', 'demo'] as const;

export const userRolesInscription = ['gestionnaire', 'professionnel'] as const satisfies UserRole[];
