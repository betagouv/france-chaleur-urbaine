import { z } from 'zod';

import { businessRules } from '@/modules/app/business-rules';
import { networkTypes } from '@/modules/reseaux/constants';

// Permission resource types — `networkTypes` (depuis reseaux/constants) sert directement de sous-ensemble réseau.
export const territoryPermissionResourceTypes = ['commune', 'epci', 'ept', 'departement', 'region'] as const;
// Scope « organisation » (opérateur national) : 1 permission = toutes les demandes des réseaux de l'org.
// resource_id = `organizations.id` (uuid). Voir buildDemandAccessFilter (Piste 1, sous-requête).
export const organizationPermissionType = 'organization' as const;
// Custom territory (admin-defined set of communes, `custom_territories` table): resource_id = `custom_territories.id` (uuid),
// matched against the `custom_territory_ids` array denormalized on the demands tables.
export const customTerritoryPermissionType = 'custom_territory' as const;
export const permissionTypes = [
  ...networkTypes,
  ...territoryPermissionResourceTypes,
  organizationPermissionType,
  customTerritoryPermissionType,
] as const;

export type TerritoryPermissionType = (typeof territoryPermissionResourceTypes)[number];
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

export const zTerritoryPermission = z.object({ resource_id: z.string(), type: z.enum(territoryPermissionResourceTypes) });

// A custom territory id is interpolated as `::uuid[]` in SQL filters: reject anything else upfront.
export const zPermission = z
  .object({ resource_id: z.string(), type: z.enum(permissionTypes) })
  .refine((permission) => permission.type !== customTerritoryPermissionType || z.uuid().safeParse(permission.resource_id).success, {
    message: 'Identifiant de territoire personnalisé invalide',
    path: ['resource_id'],
  });

export const MAX_PERMISSIONS_PER_USER = businessRules.maxPermissionsPerUser.value;

export const zPermissionInput = z
  .array(zPermission)
  .max(MAX_PERMISSIONS_PER_USER, `Maximum ${MAX_PERMISSIONS_PER_USER} permissions par utilisateur`);

export type NetworkPermission = z.infer<typeof zNetworkPermission>;
export type TerritoryPermission = z.infer<typeof zTerritoryPermission>;
export type Permission = z.infer<typeof zPermission>;

// Permission with resolved human-readable label
export type PermissionWithLabel = Permission & { label: string };

// Stable key for a permission (used as map bounds dictionary key, React list key, etc.)
export const permissionBoundsKey = (type: PermissionType, resource_id: string): string => `${type}:${resource_id}`;
