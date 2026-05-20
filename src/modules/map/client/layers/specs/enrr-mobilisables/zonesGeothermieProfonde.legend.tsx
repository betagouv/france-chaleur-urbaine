import Link from '@/components/ui/Link';

import { LegendCheckbox } from '../../../legend/LegendCheckbox';
import { LegendIcon } from '../../../legend/LegendIcon';
import {
  enrrMobilisablesZonesGeothermieProfondeLayerColor,
  enrrMobilisablesZonesGeothermieProfondeLayerOpacity,
} from './zonesGeothermieProfonde';

/** Standalone toggle for "Géothermie profonde (zones potentielles)". */
export function ZonesGeothermieProfondeLegend() {
  return (
    <LegendCheckbox
      path="enrrMobilisablesGeothermieProfonde"
      label="Géothermie profonde"
      icon={
        <LegendIcon
          type="polygon"
          stroke={enrrMobilisablesZonesGeothermieProfondeLayerColor}
          fillOpacity={enrrMobilisablesZonesGeothermieProfondeLayerOpacity}
        />
      }
      tooltip={
        <>
          Gisements potentiels ou prouvés de géothermie profonde en France pour la production de chaleur, issus de la compilation des
          connaissances géologiques et hydrogéologiques dans les bassins géologiques français.
          <br />
          Source :{' '}
          <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
            BRGM
          </Link>
        </>
      }
    />
  );
}
