import { z } from 'zod';

import { networkTypes } from '@/modules/reseaux/constants';

// Permission resource types — `networkTypes` (depuis reseaux/constants) sert directement de sous-ensemble réseau.
export const territoryPermissionResourceTypes = ['commune', 'epci', 'ept', 'departement', 'region'] as const;
export const territoryPermissionTypes = [...territoryPermissionResourceTypes, 'national'] as const;
// Scope « organisation » (opérateur national) : 1 permission = toutes les demandes des réseaux de l'org.
// resource_id = `organizations.id` (uuid). Voir buildDemandAccessFilter (Piste 1, sous-requête).
export const organizationPermissionType = 'organization' as const;
export const permissionTypes = [...networkTypes, ...territoryPermissionTypes, organizationPermissionType] as const;

export type TerritoryPermissionType = (typeof territoryPermissionTypes)[number];
export type PermissionType = (typeof permissionTypes)[number];

// Mapping from territory permission type to demands column name
export const territoryPermissionToColumn = {
  commune: 'commune_code',
  departement: 'departement_code',
  epci: 'epci_code',
  ept: 'ept_code',
  region: 'region_code',
} as const satisfies Record<(typeof territoryPermissionResourceTypes)[number], string>;

// Zod schemas (source of truth for Permission types)
export const zNetworkPermission = z.object({
  resource_id: z.string(),
  type: z.enum(networkTypes),
});

export const zTerritoryPermission = z.discriminatedUnion('type', [
  z.object({ resource_id: z.string(), type: z.enum(territoryPermissionResourceTypes) }),
  z.object({ resource_id: z.null(), type: z.literal('national') }),
]);

export const zPermission = z.discriminatedUnion('type', [
  z.object({ resource_id: z.string(), type: z.enum([...networkTypes, ...territoryPermissionResourceTypes]) }),
  z.object({ resource_id: z.string(), type: z.literal(organizationPermissionType) }),
  z.object({ resource_id: z.null(), type: z.literal('national') }),
]);

export const MAX_PERMISSIONS_PER_USER = 400;

export const zPermissionInput = z
  .array(zPermission)
  .max(MAX_PERMISSIONS_PER_USER, `Maximum ${MAX_PERMISSIONS_PER_USER} permissions par utilisateur`);

export type NetworkPermission = z.infer<typeof zNetworkPermission>;
export type TerritoryPermission = z.infer<typeof zTerritoryPermission>;
export type Permission = z.infer<typeof zPermission>;

// Permission with resolved human-readable label
export type PermissionWithLabel = Permission & { label: string };

// Stable key for a permission (used as map bounds dictionary key, React list key, etc.)
export const permissionBoundsKey = (type: PermissionType, resource_id: string | null): string => `${type}:${resource_id ?? ''}`;
