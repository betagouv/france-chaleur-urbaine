import { Demand } from 'src/types/Summary/Demand';
import { EmailInfo, Name, OtherInfo } from './Contact.styles';
import { Icon } from '@dataesr/react-dsfr';
import ModalEmails from './ModalEmails';
import { useState } from 'react';

const Contact = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
}) => {
  const [showEmailsModal, setShowEmailsModal] = useState(false);

  return (
    <>
      <>
        <Name>
          {demand.Prénom ?? ''} {demand.Nom}
        </Name>
        {demand.Établissement && <div>{demand.Établissement}</div>}
        {demand.Mail && (
          <EmailInfo
            onClick={() => {
              setShowEmailsModal(true);
            }}
          >
            <Icon size="lg" name="ri-mail-line" />
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
    </>
  );
};

export default Contact;
