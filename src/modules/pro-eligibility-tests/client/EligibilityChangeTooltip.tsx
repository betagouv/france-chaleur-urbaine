import { eligibilityTitleByType } from '@/components/EligibilityHelpDialog';
import type { RouterOutput } from '@/modules/trpc/client';
import cx from '@/utils/cx';
import { formatFrenchDateTime } from '@/utils/date';

export type EligibilityChangeTooltipProps = {
  history: RouterOutput['proEligibilityTests']['get']['addresses'][number]['eligibility_history'];
};

const transitionLabels: Record<string, string> = {
  amelioration_proximite: 'Amélioration de la proximité',
  changement_reseau: 'Changement de réseau',
  changement_type: 'Changement de type',
  degradation_proximite: 'Dégradation de la proximité',
  eloignement: 'Éloignement du réseau',
  entree_pdp: 'Entrée dans un PDP',
  entree_ville_reseau_sans_trace: 'Entrée dans une ville avec réseau sans tracé',
  futur_vers_existant: 'Réseau futur devenu existant',
  initial: 'Calcul initial',
  modification_mineure: 'Modification mineure',
  none: 'Aucun changement',
  nouveau_reseau: 'Nouveau réseau',
  nouveau_reseau_existant: 'Nouveau réseau existant',
  nouveau_reseau_futur: 'Nouveau réseau futur',
  rapprochement: 'Rapprochement du réseau',
  reseau_supprime: 'Réseau supprimé',
  sortie_pdp: "Sortie d'un PDP",
  sortie_ville_reseau_sans_trace: "Sortie d'une ville avec réseau sans tracé",
};

const EligibilityChangeTooltip: React.FC<EligibilityChangeTooltipProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <div className="text-xs">Aucun historique disponible</div>;
  }

  // Reverse to show most recent first, skip initial entry
  const changes = [...history].reverse().filter((entry) => entry.transition !== 'initial');
  const initialEntry = history.find((entry) => entry.transition === 'initial');
  const mostRecent = changes[0];

  return (
    <div className="text-xs space-y-3 max-w-[600px] max-h-[500px] overflow-y-auto">
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
                    <div>Réseau : {entry.eligibility.nom}</div>
                    <div>Distance : {entry.eligibility.distance}m</div>
                    {entry.eligibility.contenuCO2ACV !== undefined && (
                      <div>CO2 ACV : {(entry.eligibility.contenuCO2ACV * 1000).toFixed(0)} g/kWh</div>
                    )}
                    {entry.eligibility.tauxENRR !== undefined && <div>Taux EnR&R : {entry.eligibility.tauxENRR}%</div>}
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
              {initialEntry.eligibility.contenuCO2ACV !== undefined && (
                <div>CO2 ACV : {(initialEntry.eligibility.contenuCO2ACV * 1000).toFixed(0)} g/kWh</div>
              )}
              {initialEntry.eligibility.tauxENRR !== undefined && <div>Taux EnR&R : {initialEntry.eligibility.tauxENRR}%</div>}
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

export default EligibilityChangeTooltip;
