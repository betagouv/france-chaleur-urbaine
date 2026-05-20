/**
 * Compatibility re-export — the actual definition lives in the V2 map module:
 *   `src/modules/map/client/map-configuration.ts`
 *
 * Existing V1 imports (`@/components/Map/map-configuration`) continue to work
 * unchanged. Migrate new code to import directly from
 * `@/modules/map/client/map-configuration`.
 */
export * from '@/modules/map/client/config/map-configuration';
