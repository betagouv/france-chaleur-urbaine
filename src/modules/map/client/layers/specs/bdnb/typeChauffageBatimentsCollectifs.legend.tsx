import Link from '@/components/ui/Link';
import { dataSourcesVersions } from '@/modules/app/constants';

import { LegendIcon } from '../../../legend/LegendIcon';
import { LegendIntervalSlider } from '../../../legend/LegendIntervalSlider';
import { LegendSection } from '../../../legend/LegendSection';
import {
  energyFilterInterval,
  typeChauffageBatimentsCollectifsStyle,
  typeChauffageBatimentsOpacity,
} from './typeChauffageBatimentsCollectifs';

const bdnbTooltip = (
  <>
    Données :{' '}
    <Link href={dataSourcesVersions.bdnb.link} isExternal>
      {dataSourcesVersions.bdnb.version}
    </Link>
  </>
);

/**
 * Bâtiments chauffés au gaz collectif — master toggle + slider sur nb de lots.
 */
export function BatimentsGazCollectifLegend() {
  return (
    <LegendSection
      id="batiments-gaz-collectif"
      title="Bâtiments chauffés au gaz collectif"
      togglePath="batimentsGazCollectif.show"
      trackingEvent="Carto|Bâtiments au gaz collectif"
      icon={<LegendIcon type="square" color={typeChauffageBatimentsCollectifsStyle.gaz} opacity={typeChauffageBatimentsOpacity} />}
      tooltip={bdnbTooltip}
      contentClassName="mx-4"
    >
      <LegendIntervalSlider
        path="batimentsGazCollectif.interval"
        domain={[energyFilterInterval.min, energyFilterInterval.max]}
        label="Nombre de lots d'habitation"
        classes={{ label: 'text-sm' }}
        openEndedBounds
      />
    </LegendSection>
  );
}

/**
 * Bâtiments chauffés au fioul collectif — master toggle + slider sur nb de lots.
 */
export function BatimentsFioulCollectifLegend() {
  return (
    <LegendSection
      id="batiments-fioul-collectif"
      title="Bâtiments chauffés au fioul collectif"
      togglePath="batimentsFioulCollectif.show"
      trackingEvent="Carto|Bâtiments au fioul collectif"
      icon={<LegendIcon type="square" color={typeChauffageBatimentsCollectifsStyle.fioul} opacity={typeChauffageBatimentsOpacity} />}
      tooltip={bdnbTooltip}
      contentClassName="mx-4"
    >
      <LegendIntervalSlider
        path="batimentsFioulCollectif.interval"
        domain={[energyFilterInterval.min, energyFilterInterval.max]}
        label="Nombre de lots d'habitation"
        classes={{ label: 'text-sm' }}
        openEndedBounds
      />
    </LegendSection>
  );
}
