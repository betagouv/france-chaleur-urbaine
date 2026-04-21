import { z } from 'zod';

// Permission resource types
export const networkPermissionTypes = ['reseau_existant', 'reseau_en_construction'] as const;
export const territoryPermissionTypes = ['commune', 'epci', 'ept', 'departement', 'region', 'national'] as const;
export const permissionTypes = [...networkPermissionTypes, ...territoryPermissionTypes] as const;

export type NetworkPermissionType = (typeof networkPermissionTypes)[number];
export type TerritoryPermissionType = (typeof territoryPermissionTypes)[number];
export type PermissionType = (typeof permissionTypes)[number];

// Discriminated union for permissions
export type NetworkPermission = {
  type: NetworkPermissionType;
  resourceId: string;
};

export type TerritoryPermissionWithResource = {
  type: Exclude<TerritoryPermissionType, 'national'>;
  resourceId: string;
};

export type NationalPermission = {
  type: 'national';
  resourceId: null;
};

export type TerritoryPermission = TerritoryPermissionWithResource | NationalPermission;

export type Permission = NetworkPermission | TerritoryPermission;

// Mapping from territory permission type to demands column name
export const territoryPermissionToColumn = {
  commune: 'commune_code',
  departement: 'departement_code',
  epci: 'epci_code',
  ept: 'ept_code',
  region: 'region_code',
} as const satisfies Record<Exclude<TerritoryPermissionType, 'national'>, string>;

// Zod schema
export const zPermission = z.discriminatedUnion('type', [
  z.object({ resourceId: z.string(), type: z.literal('reseau_existant') }),
  z.object({ resourceId: z.string(), type: z.literal('reseau_en_construction') }),
  z.object({ resourceId: z.string(), type: z.literal('commune') }),
  z.object({ resourceId: z.string(), type: z.literal('epci') }),
  z.object({ resourceId: z.string(), type: z.literal('ept') }),
  z.object({ resourceId: z.string(), type: z.literal('departement') }),
  z.object({ resourceId: z.string(), type: z.literal('region') }),
  z.object({ resourceId: z.null(), type: z.literal('national') }),
]);

export const zPermissionInput = z.array(zPermission).max(200, 'Maximum 200 permissions par utilisateur');

export const MAX_PERMISSIONS_PER_USER = 200;

// Permission with resolved human-readable label
export type PermissionWithLabel = Permission & { label: string };

// Stable key for a permission (used as map bounds dictionary key, React list key, etc.)
export const permissionBoundsKey = (type: PermissionType, resourceId: string | null): string => `${type}:${resourceId ?? ''}`;
