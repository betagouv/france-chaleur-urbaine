export type LngLat = [longitude: number, latitude: number];

export type BBox = [west: number, south: number, east: number, north: number];

export type InitialView = { center: LngLat; zoom?: number } | { bbox: BBox };
