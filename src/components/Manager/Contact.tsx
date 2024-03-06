import { Demand } from 'src/types/Summary/Demand';
import { EmailInfo, Name, OtherInfo } from './Contact.styles';
import { Icon } from '@dataesr/react-dsfr';
import ModalEmails from './ModalEmails';
import { useState } from 'react';
import { User } from 'next-auth';

const Contact = ({
  demand,
  updateDemand,
  currentUser,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
  currentUser?: User;
}) => {
  const [showEmailsModal, setShowEmailsModal] = useState(false);

  return (
    <>
      <>
        <Name>
          {demand.Prénom && demand.Prénom} {demand.Nom}
        </Name>
        {demand.Établissement && <div>{demand.Établissement}</div>}
        {demand.Mail && (
          <EmailInfo
            onClick={() => {
              setShowEmailsModal(true);
            }}
          >
            <Icon size="lg" name="ri-mail-line" />
            {demand.Mail}
          </EmailInfo>
        )}
        {demand.Téléphone && <OtherInfo>{demand.Téléphone}</OtherInfo>}
      </>
      {demand.Mail && currentUser && (
        <ModalEmails
          isOpen={showEmailsModal}
          currentUser={currentUser}
          currentDemand={demand}
          updateDemand={updateDemand}
          onClose={() => setShowEmailsModal(false)}
        />
      )}
    </>
  );
};

export default Contact;
