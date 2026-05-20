import { LegendCheckbox } from '../../legend/LegendCheckbox';
import {
  batimentsRaccordesReseauxChaleurFroidOpacity,
  batimentsRaccordesReseauxDeChaleurColor,
  batimentsRaccordesReseauxDeFroidColor,
} from './batimentsRaccordesReseauxChaleurFroid';

export function BatimentsRaccordesReseauxChaleurLegend() {
  return (
    <LegendCheckbox
      path="batimentsRaccordesReseauxChaleur"
      trackingEvent="Carto|Bâtiments raccordés réseau chaleur"
      label={
        <div className="flex items-start gap-2">
          <SquareSwatch color={batimentsRaccordesReseauxDeChaleurColor} opacity={batimentsRaccordesReseauxChaleurFroidOpacity} />
          <span>Bâtiments raccordés à un réseau de chaleur</span>
        </div>
      }
    />
  );
}

export function BatimentsRaccordesReseauxFroidLegend() {
  return (
    <LegendCheckbox
      path="batimentsRaccordesReseauxFroid"
      trackingEvent="Carto|Bâtiments raccordés réseau froid"
      label={
        <div className="flex items-start gap-2">
          <SquareSwatch color={batimentsRaccordesReseauxDeFroidColor} opacity={batimentsRaccordesReseauxChaleurFroidOpacity} />
          <span>Bâtiments raccordés à un réseau de froid</span>
        </div>
      }
    />
  );
}

/**
 * 16×16 colored square swatch wrapped in a 24px-wide box so the icon column
 * visually aligns with the 24px line swatches used by other Réseaux rows.
 */
function SquareSwatch({ color, opacity }: { color: string; opacity?: number }) {
  return (
    <span aria-hidden className="mt-0.5 inline-flex h-4 min-w-6 shrink-0">
      <span className="inline-block size-4" style={{ backgroundColor: color, opacity }} />
    </span>
  );
}
