import Link from '@/components/ui/Link';

import { LegendCheckbox } from '../../../legend/LegendCheckbox';
import { LegendIcon } from '../../../legend/LegendIcon';
import { enrrMobilisablesThalassothermieLayerColor, enrrMobilisablesThalassothermieLayerOpacity } from './thalassothermie';

/** Standalone toggle for "Thalassothermie". */
export function ThalassothermieLegend() {
  return (
    <LegendCheckbox
      path="enrrMobilisablesThalassothermie"
      label="Thalassothermie"
      icon={
        <LegendIcon
          type="polygon"
          stroke={enrrMobilisablesThalassothermieLayerColor}
          fillOpacity={enrrMobilisablesThalassothermieLayerOpacity}
        />
      }
      tooltip={
        <>
          Données mises à disposition par le projet{' '}
          <Link href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" isExternal>
            EnRezo
          </Link>{' '}
          du Cerema.
        </>
      }
    />
  );
}
