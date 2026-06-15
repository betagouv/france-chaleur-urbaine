import type { RefObject } from 'react';

import type { MapCanvasController } from '../core/controller';

type City = { name: string; center: [number, number]; zoom: number };

const cities: City[] = [
  { center: [2.3522, 48.8566], name: 'Paris', zoom: 11 },
  { center: [4.835, 45.764], name: 'Lyon', zoom: 11 },
  { center: [5.369, 43.297], name: 'Marseille', zoom: 11 },
];

type FlyToButtonsProps = {
  /** Ref forwarded from a `<MapCanvas>` — gives access to the controller from outside the canvas. */
  mapRef: RefObject<MapCanvasController | null>;
};

/**
 * Dev-only helper: small button bar that demonstrates the controller API
 * used from outside the `<MapCanvas>` subtree.
 */
export function FlyToButtons({ mapRef }: FlyToButtonsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {cities.map((city) => (
        <button
          key={city.name}
          type="button"
          className="rounded bg-(--background-action-high-blue-france) px-2 py-1 text-xs text-white"
          onClick={() => mapRef.current?.flyTo(city.center, { zoom: city.zoom })}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
}
