export enum USER_ROLE {
  ADMIN = 'admin',
  GESTIONNAIRE = 'gestionnaire',
  PROFESSIONNEL = 'professionnel',
  DEMO = 'demo',
}

export type UserRole = `${USER_ROLE}`;
