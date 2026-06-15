import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { LegendIcon } from '../../legend/LegendIcon';
import { zonesAUrbaniserColor, zonesAUrbaniserOpacity } from './zonesAUrbaniser';

/**
 * Standalone toggle for "Zones à urbaniser" — no accordion, no body.
 */
export function ZonesAUrbaniserLegend() {
  return (
    <LegendCheckbox
      path="zonesAUrbaniser"
      trackingEvent="Carto|Zones à urbaniser"
      label="Zones à urbaniser"
      icon={<LegendIcon type="polygon" stroke={zonesAUrbaniserColor} fillOpacity={zonesAUrbaniserOpacity} />}
      tooltip={
        <>
          Zones destinées à être ouvertes à l'urbanisation selon les documents d'urbanisme en vigueur.
          <br />
          Source : Cerema
        </>
      }
      className="pl-3 pr-9"
    />
  );
}
