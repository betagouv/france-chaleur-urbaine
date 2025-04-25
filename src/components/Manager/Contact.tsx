import { useCallback, useState } from 'react';

import Icon from '@/components/ui/Icon';
import { type Demand } from '@/types/Summary/Demand';

import { ContactInfos, EmailInfo, Name, OtherInfo } from './Contact.styles';
import ModalEmails from './ModalEmails';

const Contact = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
}) => {
  const [showEmailsModal, setShowEmailsModal] = useState(false);

  const getNomStructure = useCallback(() => {
    if (
      demand['Structure accompagnante'] &&
      (demand['Structure accompagnante'].includes("Bureau d'études ou AMO") ||
        demand['Structure accompagnante'].includes('Mandataire / délégataire CEE') ||
        demand['Structure accompagnante'].includes('Syndic de copropriété'))
    ) {
      return demand['Nom de la structure accompagnante']
        ? demand['Nom de la structure accompagnante'] + ' (' + demand['Structure accompagnante'] + ')'
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
    <ContactInfos className="w-full">
      <>
        <Name>
          {demand.Prénom ?? ''} {demand.Nom}
        </Name>
        {nomStructure && <div>{nomStructure}</div>}
        {demand.Mail && (
          <EmailInfo
            onClick={() => {
              setShowEmailsModal(true);
            }}
          >
            <Icon size="sm" name="ri-mail-line" className="fr-mr-1w" />
            <u className="whitespace-normal">{demand.Mail}</u>
          </EmailInfo>
        )}
        {demand.Téléphone && (
          <OtherInfo>
            <Icon size="sm" name="ri-phone-line" className="fr-mr-1w" />
            <span>{demand.Téléphone}</span>
          </OtherInfo>
        )}
      </>
      {demand.Mail && (
        <ModalEmails
          isOpen={showEmailsModal}
          currentDemand={demand}
          updateDemand={updateDemand}
          onClose={() => setShowEmailsModal(false)}
        />
      )}
      {nomStructureAccompagnante && <div>Pour le compte de : {nomStructureAccompagnante}</div>}
    </ContactInfos>
  );
};

export default Contact;
