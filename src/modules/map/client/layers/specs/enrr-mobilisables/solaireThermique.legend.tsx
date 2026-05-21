import Link from '@/components/ui/Link';

import { LegendCheckbox } from '../../../legend/LegendCheckbox';
import { LegendIcon } from '../../../legend/LegendIcon';
import { LegendSection } from '../../../legend/LegendSection';
import { enrrMobilisablesFrichesLayerColor, enrrMobilisablesFrichesLayerOpacity } from './friches';
import { enrrMobilisablesParkingsLayerColor, enrrMobilisablesParkingsLayerOpacity } from './parkings';

/**
 * Solaire thermique — master toggle + 2 sub-options (friches, parkings).
 * Both share the same `enrrMobilisablesSolaireThermique.show` master.
 */
export function SolaireThermiqueLegend() {
  return (
    <LegendSection
      id="enrr-solaire-thermique"
      title="Solaire thermique"
      togglePath="enrrMobilisablesSolaireThermique.show"
      trackingEvent="Carto|ENR&R Mobilisables"
      tooltip={
        <>
          Données du projet{' '}
          <Link href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" isExternal>
            EnRezo
          </Link>{' '}
          du Cerema.
        </>
      }
    >
      <LegendCheckbox
        path="enrrMobilisablesSolaireThermique.showFriches"
        trackingEvent="Carto|Solaire thermique - friches"
        label="Friches"
        icon={<LegendIcon type="polygon" stroke={enrrMobilisablesFrichesLayerColor} fillOpacity={enrrMobilisablesFrichesLayerOpacity} />}
      />
      <LegendCheckbox
        path="enrrMobilisablesSolaireThermique.showParkings"
        trackingEvent="Carto|Solaire thermique - parkings"
        label="Parkings"
        icon={<LegendIcon type="polygon" stroke={enrrMobilisablesParkingsLayerColor} fillOpacity={enrrMobilisablesParkingsLayerOpacity} />}
      />
    </LegendSection>
  );
}
