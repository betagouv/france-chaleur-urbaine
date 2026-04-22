import { z } from 'zod';

// Permission resource types
export const networkPermissionTypes = ['reseau_existant', 'reseau_en_construction'] as const;
export const territoryPermissionTypes = ['commune', 'epci', 'ept', 'departement', 'region', 'national'] as const;
export const permissionTypes = [...networkPermissionTypes, ...territoryPermissionTypes] as const;

export type NetworkPermissionType = (typeof networkPermissionTypes)[number];
export type TerritoryPermissionType = (typeof territoryPermissionTypes)[number];
export type PermissionType = (typeof permissionTypes)[number];

// Mapping from territory permission type to demands column name
export const territoryPermissionToColumn = {
  commune: 'commune_code',
  departement: 'departement_code',
  epci: 'epci_code',
  ept: 'ept_code',
  region: 'region_code',
} as const satisfies Record<Exclude<TerritoryPermissionType, 'national'>, string>;

// Zod schemas (source of truth for Permission types)
const territoryWithResourceTypes = ['commune', 'epci', 'ept', 'departement', 'region'] as const;

export const zNetworkPermission = z.object({
  resource_id: z.string(),
  type: z.enum(networkPermissionTypes),
});

export const zTerritoryPermission = z.discriminatedUnion('type', [
  z.object({ resource_id: z.string(), type: z.enum(territoryWithResourceTypes) }),
  z.object({ resource_id: z.null(), type: z.literal('national') }),
]);

export const zPermission = z.discriminatedUnion('type', [
  z.object({ resource_id: z.string(), type: z.enum([...networkPermissionTypes, ...territoryWithResourceTypes]) }),
  z.object({ resource_id: z.null(), type: z.literal('national') }),
]);

export const zPermissionInput = z.array(zPermission).max(200, 'Maximum 200 permissions par utilisateur');

export const MAX_PERMISSIONS_PER_USER = 200;

export type NetworkPermission = z.infer<typeof zNetworkPermission>;
export type TerritoryPermission = z.infer<typeof zTerritoryPermission>;
export type Permission = z.infer<typeof zPermission>;

// Permission with resolved human-readable label
export type PermissionWithLabel = Permission & { label: string };

// Stable key for a permission (used as map bounds dictionary key, React list key, etc.)
export const permissionBoundsKey = (type: PermissionType, resource_id: string | null): string => `${type}:${resource_id ?? ''}`;
