export type LngLat = [longitude: number, latitude: number];

export type BBox = [west: number, south: number, east: number, north: number];

/** `bbox`: the first camera fits it (no animation, no tile loaded at the default France view); `maxZoom` caps that fit. */
export type InitialView = { center: LngLat; zoom?: number } | { bbox: BBox; maxZoom?: number };
