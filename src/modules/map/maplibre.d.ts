/**
 * Module augmentation: narrows maplibre-gl `Map.addSource` / `getSource` /
 * `removeSource` to the project's `SourceId` union, and adds a generic on
 * `getSource<T>` so call sites no longer need `as GeoJSONSource | undefined`.
 *
 * Caveat: TypeScript merges these as additional overloads; the original
 * `string`-accepting signature still exists and wins for unknown literals.
 * Effective gains: autocompletion on IDs + typed return on `getSource<T>`.
 */
import type {} from 'maplibre-gl';

import type { SourceId } from './client/core/common';

declare module 'maplibre-gl' {
  interface Map {
    addSource(id: SourceId, source: SourceSpecification | CanvasSourceSpecification): this;
    getSource<T extends Source = Source>(id: SourceId): T | undefined;
    removeSource(id: SourceId): this;
  }
}
