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
      icon={<LegendIcon type="square" color={typeChauffageBatimentsCollectifsStyle.gaz} opacity={typeChauffageBatimentsOpacity} />}
      tooltip={bdnbTooltip}
    >
      <div className="pt-2 px-3">
        <LegendIntervalSlider
          path="batimentsGazCollectif.interval"
          domain={[energyFilterInterval.min, energyFilterInterval.max]}
          label="Nombre de lots d'habitation"
        />
      </div>
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
      icon={<LegendIcon type="square" color={typeChauffageBatimentsCollectifsStyle.fioul} opacity={typeChauffageBatimentsOpacity} />}
      tooltip={bdnbTooltip}
    >
      <div className="pt-2 px-3">
        <LegendIntervalSlider
          path="batimentsFioulCollectif.interval"
          domain={[energyFilterInterval.min, energyFilterInterval.max]}
          label="Nombre de lots d'habitation"
        />
      </div>
    </LegendSection>
  );
}
