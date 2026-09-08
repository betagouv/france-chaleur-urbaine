import { useCallback } from 'react';

import Icon from '@/components/ui/Icon';
import cx from '@/utils/cx';

import type { Demand } from '../types';

const Contact = ({
  demand,
  onEmailClick,
  disabled = false,
}: {
  demand: Demand;
  onEmailClick: (demand: Demand) => void;
  disabled?: boolean;
}) => {
  const getNomStructure = useCallback(() => {
    if (
      demand['Structure accompagnante'] &&
      (demand['Structure accompagnante'].includes("Bureau d'études ou AMO") ||
        demand['Structure accompagnante'].includes('Mandataire / délégataire CEE') ||
        demand['Structure accompagnante'].includes('Syndic de copropriété'))
    ) {
      return demand['Nom de la structure accompagnante']
        ? `${demand['Nom de la structure accompagnante']} (${demand['Structure accompagnante']})`
        : '';
    }
    return demand.Établissement;
  }, [demand]);
  const nomStructure = getNomStructure();

  const getNomStructureAccompagnante = useCallback(() => {
    if (
      demand['Structure accompagnante'] &&
      (demand['Structure accompagnante'].includes("Bureau d'études ou AMO") ||
        demand['Structure accompagnante'].includes('Mandataire / délégataire CEE')) &&
      (demand.Structure === 'Bailleur social' || demand.Structure === 'Tertiaire' || demand.Structure === 'Autre')
    ) {
      return demand.Établissement;
    }
    return '';
  }, [demand]);
  const nomStructureAccompagnante = getNomStructureAccompagnante();

  const fullName = `${demand.Prénom ?? ''} ${demand.Nom}`.trim();
  const details = [
    fullName,
    nomStructure,
    nomStructureAccompagnante && `Pour le compte de : ${nomStructureAccompagnante}`,
    demand.Mail,
    demand.Téléphone,
  ]
    .filter(Boolean)
    .join('\n');

  // Three truncated lines (fixed-height table rows); the full details stay in the tooltip.
  return (
    <div className="w-full min-w-0 leading-5" title={details}>
      <div className="truncate">
        <span className="font-bold">{fullName}</span>
        {nomStructure && <span className="text-gray-500 text-[13px]"> · {nomStructure}</span>}
      </div>
      {demand.Mail && (
        <div
          className={cx(
            'text-gray-500 text-[13px] truncate',
            disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-100 cursor-pointer'
          )}
          onClick={(event) => {
            event.stopPropagation();
            if (disabled) return;
            onEmailClick(demand);
          }}
          title={disabled ? 'Demande hors de votre périmètre — envoi de mail désactivé' : undefined}
        >
          <Icon size="sm" name="ri-mail-line" className="fr-mr-1w" />
          <u>{demand.Mail}</u>
        </div>
      )}
      {(demand.Téléphone || nomStructureAccompagnante) && (
        <div className="text-gray-500 text-[13px] truncate">
          {demand.Téléphone && (
            <>
              <Icon size="sm" name="ri-phone-line" className="fr-mr-1w" />
              <span>{demand.Téléphone}</span>
            </>
          )}
          {nomStructureAccompagnante && (
            <span>
              {demand.Téléphone ? ' · ' : ''}Pour le compte de : {nomStructureAccompagnante}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Contact;
