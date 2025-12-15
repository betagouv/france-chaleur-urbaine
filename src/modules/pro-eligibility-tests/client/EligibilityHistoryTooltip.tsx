import { eligibilityTitleByType } from '@/modules/demands/constants';
import { transitionLabels } from '@/modules/pro-eligibility-tests/constants';
import type { RouterOutput } from '@/modules/trpc/client';
import cx from '@/utils/cx';
import { formatFrenchDateTime } from '@/utils/date';

export type EligibilityHistoryTooltipProps = {
  history: RouterOutput['proEligibilityTests']['get']['addresses'][number]['eligibility_history'];
};

const EligibilityHistoryTooltip: React.FC<EligibilityHistoryTooltipProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <div className="text-xs">Aucun historique disponible</div>;
  }

  // Reverse to show most recent first, skip initial entry
  const changes = [...history].reverse().filter((entry) => entry.transition !== 'initial');
  const initialEntry = history.find((entry) => entry.transition === 'initial');

  return (
    <div className="text-xs space-y-3 max-w-xl max-h-[500px] overflow-y-auto">
      <div className="font-semibold sticky top-0 bg-white pb-2 border-b border-gray-200">Historique des changements ({changes.length})</div>

      {changes.length > 0 && (
        <div className="space-y-2">
          {changes.map((entry, index) => {
            const isRecent = index === 0;
            return (
              <div
                key={index}
                className={cx(
                  'border rounded-lg p-3 transition-colors',
                  isRecent ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={cx('font-semibold text-sm', isRecent ? 'text-blue-900' : 'text-gray-900')}>
                    {transitionLabels[entry.transition] || entry.transition}
                  </div>
                  {isRecent && <span className="text-[10px] font-medium text-blue-700 bg-blue-200 px-1.5 py-0.5 rounded">Récent</span>}
                </div>

                <div className="space-y-1">
                  <div className={cx('font-medium', isRecent ? 'text-blue-800' : 'text-gray-700')}>
                    {eligibilityTitleByType[entry.eligibility.type]}
                  </div>
                  <div className={cx('text-xs', isRecent ? 'text-blue-700' : 'text-gray-600')}>
                    {entry.eligibility.nom && <div>Réseau : {entry.eligibility.nom}</div>}
                    {entry.eligibility.distance && <div>Distance : {entry.eligibility.distance}m</div>}
                    {entry.eligibility.contenu_co2_acv !== undefined && (
                      <div>CO2 ACV : {(entry.eligibility.contenu_co2_acv * 1000).toFixed(0)} g/kWh</div>
                    )}
                    {entry.eligibility.taux_enrr !== undefined && <div>Taux EnR&R : {entry.eligibility.taux_enrr}%</div>}
                  </div>
                  <div className={cx('text-[10px] mt-1', isRecent ? 'text-blue-600' : 'text-gray-500')}>
                    {formatFrenchDateTime(new Date(entry.calculated_at))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {initialEntry && (
        <div className="border-t border-gray-300 pt-3">
          <div className="text-gray-600 font-semibold mb-2">État initial</div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="font-medium text-gray-700 mb-1">{eligibilityTitleByType[initialEntry.eligibility.type]}</div>
            <div className="text-xs text-gray-600">
              <div>Réseau : {initialEntry.eligibility.nom}</div>
              <div>Distance : {initialEntry.eligibility.distance}m</div>
              {initialEntry.eligibility.contenu_co2_acv !== undefined && (
                <div>CO2 ACV : {(initialEntry.eligibility.contenu_co2_acv * 1000).toFixed(0)} g/kWh</div>
              )}
              {initialEntry.eligibility.taux_enrr !== undefined && <div>Taux EnR&R : {initialEntry.eligibility.taux_enrr}%</div>}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">{formatFrenchDateTime(new Date(initialEntry.calculated_at))}</div>
          </div>
        </div>
      )}

      {changes.length === 0 && initialEntry && (
        <div className="text-center text-gray-500 py-2">Aucun changement depuis le calcul initial</div>
      )}
    </div>
  );
};

export default EligibilityHistoryTooltip;
