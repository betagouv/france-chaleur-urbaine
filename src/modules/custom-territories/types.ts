import type { Selectable } from 'kysely';

import type { CustomTerritories } from '@/server/db/kysely';

export type CustomTerritory = Selectable<CustomTerritories>;

/** Minimal reference (id + name), payload of the admin dialogs. */
export type CustomTerritoryRef = Pick<CustomTerritory, 'id' | 'name'>;

/** Custom territory with the counters shown on the admin screen. */
export type CustomTerritoryListItem = CustomTerritory & {
  communes_count: number;
  users_count: number;
};
