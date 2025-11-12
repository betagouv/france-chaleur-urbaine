import { useCallback } from 'react';

import Icon from '@/components/ui/Icon';
import type { Demand } from '../types';

const Contact = ({ demand, onEmailClick }: { demand: Demand; onEmailClick: (demandId: string) => void }) => {
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

  return (
    <div className="w-full leading-5">
      <div className="font-bold">
        {demand.Prénom ?? ''} {demand.Nom}
      </div>
      {nomStructure && <div>{nomStructure}</div>}
      {demand.Mail && (
        <div
          className="text-gray-500 text-[13px] text-nowrap hover:bg-gray-100 cursor-pointer inline-block"
          onClick={(e) => {
            e.stopPropagation();
            onEmailClick(demand.id);
          }}
        >
          <Icon size="sm" name="ri-mail-line" className="fr-mr-1w" />
          <u className="whitespace-normal">{demand.Mail}</u>
        </div>
      )}
      {demand.Téléphone && (
        <div className="text-gray-500 text-[13px]">
          <Icon size="sm" name="ri-phone-line" className="fr-mr-1w" />
          <span>{demand.Téléphone}</span>
        </div>
      )}
      {nomStructureAccompagnante && <div>Pour le compte de : {nomStructureAccompagnante}</div>}
    </div>
  );
};

export default Contact;
