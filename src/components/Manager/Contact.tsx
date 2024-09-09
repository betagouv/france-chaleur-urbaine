import { useState } from 'react';

import Icon from '@components/ui/Icon';
import { Demand } from 'src/types/Summary/Demand';

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

  return (
    <ContactInfos className="fr-m-1w">
      <>
        <Name>
          {demand.Prénom ?? ''} {demand.Nom}
        </Name>
        {demand.Établissement && (
          <div>
            {demand.Établissement}
            {demand["Type d'établissement"] &&
              (demand["Type d'établissement"].includes("Bureau d'études ou AMO") ||
                demand["Type d'établissement"].includes('Mandataire / délégataire CEE')) && <>&nbsp;({demand["Type d'établissement"]})</>}
          </div>
        )}
        {demand.Mail && (
          <EmailInfo
            onClick={() => {
              setShowEmailsModal(true);
            }}
          >
            <Icon size="sm" name="ri-mail-line" className="fr-mr-1w" />
            <u>{demand.Mail}</u>
          </EmailInfo>
        )}
        {demand.Téléphone && <OtherInfo>{demand.Téléphone}</OtherInfo>}
      </>
      {demand.Mail && (
        <ModalEmails
          isOpen={showEmailsModal}
          currentDemand={demand}
          updateDemand={updateDemand}
          onClose={() => setShowEmailsModal(false)}
        />
      )}
      {demand.Structure === 'Tertiaire' ||
        (demand.Structure === 'Logement social' && <div>Pour le compte de : {demand['Nom de la structure accompagnée']}</div>)}
    </ContactInfos>
  );
};

export default Contact;
