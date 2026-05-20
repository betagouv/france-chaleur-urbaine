import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { reseauxDeFroidColor } from './reseauxDeFroid';

/**
 * Réseaux de froid — top-level Reseaux tab row.
 * Mirrors V1 : line swatch + label + hint "(tracé ou cercle au centre…)".
 */
export function ReseauxDeFroidLegend() {
  return (
    <LegendCheckbox
      path="reseauxDeFroid"
      label={
        <div className="flex items-start gap-2">
          <span
            aria-hidden
            className="mt-1.5 inline-block h-2 min-w-6 shrink-0 rounded-sm"
            style={{ backgroundColor: reseauxDeFroidColor }}
          />
          <div>
            <div>Réseaux de froid</div>
            <p className="mb-0 text-xs text-(--text-mention-grey)">(tracé ou cercle au centre de la commune si tracé non disponible)</p>
          </div>
        </div>
      }
    />
  );
}
