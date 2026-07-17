import type { ModeDeChauffageEnriched } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import cx from '@/utils/cx';

export function getGainPercentVsGaz(item: ModeDeChauffageEnriched, coutParAnGaz: number, coutParAnGazHotWaterOnly: number) {
  if (item.usage !== 'hotWaterOnly' && item.gainVsGaz !== undefined) {
    return item.gainVsGaz;
  }

  const referenceCost = item.usage === 'hotWaterOnly' ? coutParAnGazHotWaterOnly : coutParAnGaz;

  return referenceCost > 0 ? Math.round(((item.coutParAn - referenceCost) / referenceCost) * 100) : 0;
}

export function GainVsGazBadge({
  item,
  coutParAnGaz,
  coutParAnGazHotWaterOnly,
}: {
  item: ModeDeChauffageEnriched;
  coutParAnGaz: number;
  coutParAnGazHotWaterOnly: number;
}) {
  const gainPercentVsGaz = getGainPercentVsGaz(item, coutParAnGaz, coutParAnGazHotWaterOnly);
  const isSaving = gainPercentVsGaz <= 0;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 whitespace-nowrap bg-[#E3FDEB] px-1 md:px-3 py-2 font-bold',
        isSaving ? 'text-success' : 'bg-[#FFE9E6] text-error'
      )}
    >
      <span
        className={cx(
          'flex h-6 w-6 items-center justify-center rounded-full text-white',
          isSaving ? 'bg-success fr-icon-arrow-right-down-line' : 'bg-error fr-icon-arrow-right-up-line'
        )}
        aria-hidden="true"
      />
      {isSaving ? '-' : '+'}
      {Math.abs(gainPercentVsGaz)} % <span className="hidden md:inline">d’économies</span> vs gaz
    </span>
  );
}
