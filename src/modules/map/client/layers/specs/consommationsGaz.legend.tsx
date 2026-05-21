import Link from '@/components/ui/Link';
import { dataSourcesVersions } from '@/modules/app/constants';

import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { LegendIcon } from '../../legend/LegendIcon';
import { LegendIntervalSlider } from '../../legend/LegendIntervalSlider';
import { LegendSection } from '../../legend/LegendSection';
import { consommationsGazInterval, consommationsGazLayerMaxOpacity, consommationsGazLayerStyle } from './consommationsGaz';

const consommationsGazLegendColor = '#D9D9D9';

/**
 * Legend section for "Consommations globales de gaz" — master toggle +
 * 3 sub-checkboxes per usage type + a range slider on consumption levels.
 */
export function ConsommationsGazLegend() {
  return (
    <LegendSection
      id="consommations-gaz"
      title="Consommations globales de gaz"
      togglePath="consommationsGaz.show"
      icon={<LegendIcon type="circle" color={consommationsGazLegendColor} opacity={consommationsGazLayerMaxOpacity} />}
      tooltip={
        <>
          Données locales de consommation de gaz naturel de l'année {dataSourcesVersions.donneesLocalesConsommationEnergieAdresse.year}
          <br />
          Données :{' '}
          <Link href={dataSourcesVersions.donneesLocalesConsommationEnergieAdresse.link} isExternal>
            SDES
          </Link>
        </>
      }
    >
      <LegendCheckbox
        path="consommationsGaz.logements"
        label="Logements (tous types)"
        icon={<LegendIcon type="circle" color={consommationsGazLayerStyle.R} />}
      />
      <LegendCheckbox
        path="consommationsGaz.tertiaire"
        label="Tertiaire"
        icon={<LegendIcon type="circle" color={consommationsGazLayerStyle.T} />}
      />
      <LegendCheckbox
        path="consommationsGaz.industrie"
        label="Industrie"
        icon={<LegendIcon type="circle" color={consommationsGazLayerStyle.I} />}
      />
      <LegendIntervalSlider
        path="consommationsGaz.interval"
        domain={[consommationsGazInterval.min, consommationsGazInterval.max]}
        label="Niveau de consommation de gaz"
        unit=" MWh/an"
        classes={{ label: 'text-sm', root: 'mr-4' }}
      />
    </LegendSection>
  );
}
