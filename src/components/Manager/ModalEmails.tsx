import { Button } from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import Input from '@/components/form/dsfr/Input';
import TextArea from '@/components/form/dsfr/TextArea';
import Heading from '@/components/ui/Heading';
import Modal from '@/components/ui/Modal';
import emailsContentList from '@/data/manager/manager-emails-content';
import emailsList from '@/data/manager/manager-emails-list';
import { useUserPreferences } from '@/services/authentication';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { type Demand } from '@/types/Summary/Demand';

const ModalContentWrapper = styled.div`
  margin-top: -3em;
  margin-bottom: -48px; // diminue le padding de la modale
`;
const HorizontalSeparator = styled.div`
  width: 100%;
  border: 1px solid #e1e1e1;
`;

type Props = {
  isOpen: boolean;
  currentDemand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
  onClose: (...args: any[]) => any;
};
type EmailContent = {
  object: string;
  to: string;
  body: string;
  signature: string;
  cc: string;
  replyTo: string;
};
function ModalEmails(props: Props) {
  const { userPreferences, updateUserPreferences } = useUserPreferences();
  const getDefaultEmailContent = () => {
    return {
      object: '',
      to: props.currentDemand.Mail,
      body: '',
      signature: userPreferences?.signature || '',
      cc: userPreferences?.email || '',
      replyTo: userPreferences?.email || '',
    };
  };

  const [isLoaded, setIsLoaded] = useState(false);

  const emailModal = useMemo(() => {
    return createModal({
      id: `emails-modal-${props.currentDemand.id}`,
      isOpenedByDefault: false,
    });
  }, []);

  useIsModalOpen(emailModal, {
    onConceal() {
      setIsLoaded(false);
      props.onClose();
    },
  });

  const [alreadySent, setAlreadySent] = useState<string[]>([]);
  const [emailKey, setEmailKey] = useState('');
  const [emailContent, setEmailContent] = useState<EmailContent>(getDefaultEmailContent());
  const [sent, setSent] = useState(false);
  const [sentError, setSentError] = useState(false);
  const [sentHistory, setSentHistory] = useState<[]>();

  const loadModal = () => {
    setAlreadySent([]);
    setEmailKey('');
    setEmailContent(getDefaultEmailContent);
    setSent(false);
    setSentError(false);
    setSentHistory(undefined);
    emailModal.open();
  };

  useEffect(() => {
    const getEmailsHistory = async () => {
      const res = await fetch(`/api/managerEmail?demand_id=${props.currentDemand.id}`, {
        method: 'GET',
      });
      const list = await res.json();
      setSentHistory(list);
    };
    if (props.isOpen) {
      if (!isLoaded) {
        loadModal();
        setIsLoaded(true);
        getEmailsHistory();
      }
    }
  }, [props.isOpen]);

  useEffect(() => {
    if (props.currentDemand['Emails envoyés']) {
      setAlreadySent(props.currentDemand['Emails envoyés'].split('\n'));
    }
  }, [props.currentDemand]);

  function setEmailContentValue<Key extends keyof EmailContent>(key: Key, value: EmailContent[Key]) {
    setEmailContent((oldEmailContent) => ({
      ...oldEmailContent,
      [key]: value,
    }));
  }

  const onSelectedEmailChanged = (emailKey: string) => {
    setEmailKey(emailKey);
    setEmailContentValue('object', emailsContentList[emailKey].object);
    const body = emailsContentList[emailKey].body.replace('[adresse]', props.currentDemand.Adresse);
    setEmailContentValue('body', body);
  };

  const getLabel = (key: string) => {
    const email = emailsList.find((email) => {
      if (email.value === key) {
        return email;
      }
    });
    return email ? email.label : '';
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    //Save content in DB
    try {
      const res = await fetch(`/api/managerEmail`, {
        method: 'POST',
        body: JSON.stringify({
          emailContent,
          demand_id: props.currentDemand.id,
          key: emailKey,
        }),
      });
      if (res.status !== 200) {
        throw new Error(`invalid status ${res.status}`);
      }

      //Add email in Airtable demands list
      alreadySent.push(getLabel(emailKey));
      const updatedFields: any = {
        'Emails envoyés': alreadySent.join('\n'),
        'Prise de contact': true, //Prospect recontacté
      };
      if (emailKey === 'koFarFromNetwok' || emailKey === 'koIndividualHeat' || emailKey === 'koOther') {
        updatedFields.Status = DEMANDE_STATUS.UNREALISABLE;
      } else if (emailKey === 'askForPieces') {
        updatedFields.Status = DEMANDE_STATUS.WAITING;
      }
      await props.updateDemand(props.currentDemand.id, updatedFields);

      //Update the current user signature
      if (userPreferences && userPreferences.signature !== emailContent.signature) {
        void updateUserPreferences({ signature: emailContent.signature });
      }

      setSent(true);
    } catch (err: any) {
      setSentError(true);
    }
  };

  return (
    <Modal modal={emailModal} title="" size="large">
      <ModalContentWrapper>
        <Heading as="h2" center>
          Envoi d'un courriel à {emailContent?.to}
        </Heading>
        {!sent && !sentError ? (
          <>
            <HorizontalSeparator />
            <div className="fr-mt-3w fr-mb-3w">
              <b>Historique</b>
              <br />
              <ul className="fr-ml-3w">
                {sentHistory && sentHistory.length > 0 ? (
                  sentHistory.map((item: any, index) => (
                    <li key={index}>
                      {getLabel(item.email_key)} envoyé le {item.date}
                    </li>
                  ))
                ) : (
                  <li>Aucun courriel envoyé</li>
                )}
              </ul>
            </div>
            <HorizontalSeparator className="fr-mb-3w" />
            <Select
              label="Choix de la réponse"
              nativeSelectProps={{
                required: true,
                onChange: (e) => onSelectedEmailChanged(e.target.value),
                value: emailKey,
              }}
              options={[
                {
                  value: '',
                  label: '- Sélectionner une réponse -',
                  disabled: true,
                  hidden: true,
                },
                ...emailsList.map((option) => {
                  return {
                    value: option.value,
                    label: option.label,
                    disabled:
                      sentHistory &&
                      option.value !== 'other' &&
                      Array.isArray(sentHistory) &&
                      sentHistory.some((email: any) => email.email_key === option.value),
                  };
                }),
              ]}
            />
            <HorizontalSeparator className="fr-mb-3w" />
            <form onSubmit={submit}>
              <Input
                label="À"
                nativeInputProps={{
                  type: 'email',
                  required: true,
                  disabled: true,
                  defaultValue: emailContent.to,
                }}
              />
              <Input
                label="Répondre à"
                nativeInputProps={{
                  type: 'email',
                  required: true,
                  value: emailContent.replyTo,
                  onChange: (e) => setEmailContentValue('replyTo', e.target.value),
                }}
              />
              <Input
                label="Copie à"
                hintText="Les adresses emails doivent être séparées par des virgules"
                nativeInputProps={{
                  type: 'email',
                  value: emailContent.cc,
                  onChange: (e) => setEmailContentValue('cc', e.target.value),
                }}
              />
              <Input
                label="Objet"
                nativeInputProps={{
                  type: 'text',
                  required: true,
                  value: emailContent.object,
                  onChange: (e) => setEmailContentValue('object', e.target.value),
                }}
              />
              <TextArea
                label="Corps"
                nativeTextAreaProps={{
                  required: true,
                  rows: 10,
                  value: emailContent.body,
                  onChange: (e) => setEmailContentValue('body', e.target.value),
                }}
              />
              <Input
                label="Signature"
                hintText="La signature sera sauvegardée pour le prochain envoi"
                nativeInputProps={{
                  required: true,
                  value: emailContent.signature,
                  onChange: (e) => setEmailContentValue('signature', e.target.value),
                }}
              />
              <Button className="fr-mt-2w" type="submit">
                Envoyer
              </Button>
            </form>
          </>
        ) : (
          <>
            {sentError ? (
              <span>
                Il y a eu une erreur au cours de votre envoi.
                <br />
                Veuillez ré-essayer.
              </span>
            ) : (
              <span>Votre courriel a bien été envoyé !</span>
            )}
          </>
        )}
      </ModalContentWrapper>
    </Modal>
  );
}

export default ModalEmails;
