import { LegendCheckbox } from '../../legend/LegendCheckbox';
import {
  perimetresDeDeveloppementPrioritaireColor,
  perimetresDeDeveloppementPrioritaireOpacity,
} from './perimetresDeDeveloppementPrioritaire';

/**
 * Périmètres de développement prioritaire — top-level Reseaux tab row.
 * Mirrors V1 : 16×24 colored rectangle + label + tooltip.
 */
export function PerimetresDeDeveloppementPrioritaireLegend() {
  return (
    <LegendCheckbox
      path="zonesDeDeveloppementPrioritaire"
      label={
        <div className="flex items-start gap-2">
          <span
            aria-hidden
            className="mt-0.5 inline-block h-4 min-w-6 shrink-0"
            style={{ backgroundColor: perimetresDeDeveloppementPrioritaireColor, opacity: perimetresDeDeveloppementPrioritaireOpacity }}
          />
          <span>Périmètres de développement prioritaire des réseaux classés</span>
        </div>
      }
      tooltip="Dans cette zone, le raccordement des nouvelles constructions ou des bâtiments renouvelant leur installation de chauffage au-dessus d'une certaine puissance est obligatoire."
    />
  );
}
