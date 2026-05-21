import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { reseauxEnConstructionColor, reseauxEnConstructionNonOuvertColor, reseauxEnConstructionOpacity } from './reseauxEnConstruction';

/**
 * Réseaux en construction — top-level Reseaux tab row.
 * Mirrors V1's layout : a line swatch + a (translucent) filled zone swatch
 * stacked, then label + hint, then a grey "non ouverts" sub-row.
 */
export function ReseauxEnConstructionLegend() {
  return (
    <LegendCheckbox
      path="reseauxEnConstruction"
      trackingEvent="Carto|Réseaux en construction"
      label={
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <span className="mt-1 flex shrink-0 flex-col gap-1">
              <span aria-hidden className="inline-block h-2 min-w-6 rounded-sm" style={{ backgroundColor: reseauxEnConstructionColor }} />
              <span
                aria-hidden
                className="inline-block h-4 min-w-6"
                style={{ backgroundColor: reseauxEnConstructionColor, opacity: reseauxEnConstructionOpacity }}
              />
            </span>
            <div>
              <div>Réseaux de chaleur en construction</div>
              <div className="text-xs">(tracé ou zone si tracé non disponible, gris si non ouvert aux raccordements)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2 min-w-6 rounded-sm"
              style={{ backgroundColor: reseauxEnConstructionNonOuvertColor }}
            />
            <span className="text-xs">Non ouverts aux raccordements</span>
          </div>
        </div>
      }
      tooltip={
        <>
          Projets financés par l'ADEME ou signalés par les collectivités et exploitants.
          <br />
          Les tracés sont prévisionnels. Ils sont susceptibles d'être modifiés avant leur mise en service définitive.
        </>
      }
    />
  );
}
