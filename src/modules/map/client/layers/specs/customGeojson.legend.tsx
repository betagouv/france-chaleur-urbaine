import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { customGeojsonColor } from './customGeojson';

/** Admin-only: file dropped on the map to preview a trace before saving. */
export function CustomGeojsonLegend() {
  return (
    <LegendCheckbox
      path="customGeojson"
      label="Fichier déposé sur la carte"
      icon={
        <span
          aria-hidden
          className="mt-1 inline-block size-4 shrink-0 rounded-sm opacity-70"
          style={{ backgroundColor: customGeojsonColor }}
        />
      }
    />
  );
}
