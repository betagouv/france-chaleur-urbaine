import type { Selectable } from 'kysely';

import type { OrganizationApiCredentials, Organizations } from '@/server/db/kysely';

export type Organization = Selectable<Organizations>;
export type OrganizationApiCredential = Selectable<OrganizationApiCredentials>;

/** Référence minimale d'une organisation (id + nom) — payload des dialogs admin. */
export type OrganizationRef = Pick<Organization, 'id' | 'name'>;

/** Organisation enrichie de compteurs pour l'écran d'administration. */
export type OrganizationListItem = Organization & {
  networks_count: number;
  credentials_count: number;
  drifting_networks_count: number;
};

/** Credential renvoyé une seule fois à la création (le token en clair n'est jamais re-stocké). */
export type CreatedCredential = {
  id: string;
  name: string | null;
  token: string;
};

/** Credential exposé à l'admin : jamais le `token_hash`. */
export type SafeCredential = Omit<OrganizationApiCredential, 'token_hash'>;
