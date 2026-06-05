import { getCostPrecisionRange } from '@/components/ComparateurPublicodes/Graph';
import { improveDpe, type ModeDeChauffageEnriched } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import { getGainPercentVsGaz } from '@/modules/chaleur-renouvelable/client/results/ui/GainVsGazBadge';
import type { DPE } from '@/modules/chaleur-renouvelable/constants';
import cx from '@/utils/cx';

import { DpeProgression } from './DpeProgression';

type SolutionConsumptionPanelProps = {
  dpeFrom: DPE;
  item: ModeDeChauffageEnriched;
  coutParAnGaz: number;
  coutParAnGazHotWaterOnly: number;
  className?: string;
};

export function SolutionConsumptionPanel({
  dpeFrom,
  item,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
  className,
}: SolutionConsumptionPanelProps) {
  const dpeTo = improveDpe(dpeFrom, item.gainClasse);
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(item.coutParAn);
  const gainPercentVsGaz = getGainPercentVsGaz(item, coutParAnGaz, coutParAnGazHotWaterOnly);

  return (
    <div className={cx('bg-gray-100 p-5', className)}>
      <p className="mb-2 uppercase">Gain DPE</p>
      <div className="mb-4 flex items-center gap-3 border-b border-gray-300 pb-4">
        <DpeProgression from={dpeFrom} to={dpeTo} />
      </div>
      <p className="mb-1 uppercase">Coût consommation</p>
      <p className="mb-1 font-bold text-blue">
        {lowerBoundString} à {upperBoundString}
      </p>
      <p className="mb-3">par an par logement</p>
      <p className={cx('mb-0 flex items-center gap-2 font-bold', gainPercentVsGaz <= 0 ? 'text-success' : 'text-error')}>
        <span className={gainPercentVsGaz <= 0 ? 'fr-icon-arrow-right-down-line' : 'fr-icon-arrow-right-up-line'} aria-hidden="true" />
        {gainPercentVsGaz <= 0 ? '-' : '+'}
        {Math.abs(gainPercentVsGaz)} % d’économies vs gaz
      </p>
    </div>
  );
}
