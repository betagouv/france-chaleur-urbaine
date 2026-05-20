import Link from '@/components/ui/Link';

import { useMapConfig } from '../../../config/useMapConfig';
import { LegendCheckbox } from '../../../legend/LegendCheckbox';
import { LegendIcon } from '../../../legend/LegendIcon';
import { LegendSection } from '../../../legend/LegendSection';
import { installationsGeothermieProfondeLayerColor, installationsGeothermieProfondeLayerOpacity } from './installationsGeothermieProfonde';
import { aquifereColorMap, perimetresGeothermieProfondeLayerOpacity, statutColorMap } from './perimetresGeothermieProfonde';

/**
 * Géothermie profonde — master toggle + 2 sub (installations, perimetres).
 * When perimetres are shown, an extra colour-by-aquifere + statut sub-legend
 * appears below.
 */
export function GeothermieProfondeLegend() {
  const { config } = useMapConfig();
  const showPerimetres = config.geothermieProfonde.show && config.geothermieProfonde.showPerimetres;

  return (
    <LegendSection
      id="geothermie-profonde"
      title="Géothermie profonde"
      togglePath="geothermieProfonde.show"
      tooltip={
        <>
          Sources :
          <ul className="list-disc pl-4">
            <li>
              installations :{' '}
              <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                BRGM
              </Link>
            </li>
            <li>
              périmètres d'exploitation :{' '}
              <Link href="https://www.drieat.ile-de-france.developpement-durable.gouv.fr/" isExternal>
                DRIEAT
              </Link>
            </li>
          </ul>
        </>
      }
    >
      <div className="flex flex-col pt-2 pl-3 pr-1">
        <LegendCheckbox
          path="geothermieProfonde.showInstallations"
          label="Installations"
          icon={
            <LegendIcon
              type="circle"
              color={installationsGeothermieProfondeLayerColor}
              opacity={installationsGeothermieProfondeLayerOpacity}
            />
          }
        />
        <LegendCheckbox
          path="geothermieProfonde.showPerimetres"
          label="Périmètres d'exploitation"
          icon={<LegendIcon type="polygon" stroke={aquifereColorMap.Dogger} fillOpacity={perimetresGeothermieProfondeLayerOpacity} />}
        />
        {showPerimetres && (
          <div className="flex flex-col gap-2 ml-6 mt-1">
            <div className="flex flex-wrap gap-2">
              {Object.entries(aquifereColorMap).map(([aquifere, color]) => (
                <div key={aquifere} className="flex items-center gap-1 text-xs">
                  <LegendIcon type="polygon" stroke={color} fillOpacity={perimetresGeothermieProfondeLayerOpacity} strokeWidth={0} />
                  <span>{aquifere}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <LegendIcon type="polygon" stroke={statutColorMap.Existant} fillOpacity={0} />
              <span>Existant</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <LegendIcon type="polygon" stroke={statutColorMap.AR} fillOpacity={0} />
              <span>Arrêté d'autorisation de recherche</span>
            </div>
          </div>
        )}
      </div>
    </LegendSection>
  );
}
