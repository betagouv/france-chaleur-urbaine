import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { geomUpdateColor } from './geomUpdate';

/** Admin-only: pending geometry updates not yet synced. */
export function GeomUpdateLegend() {
  return (
    <LegendCheckbox
      path="geomUpdate"
      label="Géométrie modifiée"
      icon={
        <span
          aria-hidden
          className="mt-1 inline-block size-4 shrink-0 rounded-sm opacity-50"
          style={{ backgroundColor: geomUpdateColor }}
        />
      }
    />
  );
}
