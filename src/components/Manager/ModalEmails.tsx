import {
  Button,
  ModalClose,
  ModalContent,
  Select,
  TextInput,
} from '@dataesr/react-dsfr';
import { FormEvent, useEffect, useState } from 'react';
import {
  HorizontalSeparator,
  ModalContentWrapper,
  StyledModal,
} from './ModalEmails.style';
import Heading from '@components/ui/Heading';
import emailsList from '@data/manager/manager-emails-list';
import emailsContentList from '@data/manager/manager-emails-content';
import { User } from 'next-auth';
import { Demand } from 'src/types/Summary/Demand';

type Props = {
  isOpen: boolean;
  currentUser: User;
  currentDemand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
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
  const defaultEmailContent: EmailContent = {
    object: '',
    to: props.currentDemand.Mail,
    body: '',
    signature: props.currentUser.signature,
    cc: props.currentUser.email,
    replyTo: props.currentUser.email,
  };

  const [alreadySent, setAlreadySent] = useState<string[]>([]);
  const [emailKey, setEmailKey] = useState('');
  const [emailContent, setEmailContent] =
    useState<EmailContent>(defaultEmailContent);
  const [sent, setSent] = useState(false);
  const [sentError, setSentError] = useState(false);

  const resetModal = () => {
    setSent(false);
    setSentError(false);
  };

  useEffect(() => {
    if (props.currentDemand['Emails envoyés']) {
      setAlreadySent(props.currentDemand['Emails envoyés'].split('\n'));
    }
  }, [props.currentDemand]);

  function setEmailContentValue<Key extends keyof EmailContent>(
    key: Key,
    value: EmailContent[Key]
  ) {
    setEmailContent((emailContent) => ({
      ...emailContent,
      [key]: value,
    }));
  }

  const onSelectedEmailChanged = (emailKey: string) => {
    setEmailKey(emailKey);
    setEmailContentValue('object', emailsContentList[emailKey].object);
    const body = emailsContentList[emailKey].body.replace(
      '[adresse]',
      props.currentDemand.Adresse
    );
    setEmailContentValue('body', body);
  };

  const getAirtableLabel = () => {
    const email = emailsList.find((email) => {
      if (email.value === emailKey) {
        return email;
      }
    });
    return email ? email.airtableLabel : '';
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    //TODO vérifier format ?

    //Save content in DB
    try {
      const res = await fetch(`./api/managerEmail`, {
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
      alreadySent.push(getAirtableLabel());
      const updatedFields: any = {
        'Emails envoyés': alreadySent.join('\n'),
        'Prise de contact': true, //Prospect recontacté
      };
      if (
        emailKey === 'koFarFromNetwok' ||
        emailKey === 'koIndividualHeat' ||
        emailKey === 'koOther'
      ) {
        updatedFields.Status = 'Non réalisable';
      } else if (emailKey === 'askForPieces') {
        updatedFields.Status = 'En attente d’éléments du prospect';
      }
      await props.updateDemand(props.currentDemand.id, updatedFields);

      setSent(true);
    } catch (err: any) {
      //TODO remonter l'erreur quelque part ?
      setSentError(true);
    }
  };

  return (
    <StyledModal
      isOpen={props.isOpen}
      hide={() => {
        resetModal();
        props.onClose();
      }}
    >
      <ModalClose>Fermer</ModalClose>
      <ModalContent>
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
                  {alreadySent.length > 0 ? (
                    alreadySent.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>Aucun courriel envoyé</li>
                  )}
                </ul>
              </div>
              <HorizontalSeparator className="fr-mb-3w" />
              <Select
                required
                label="Choix de la réponse"
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
                        alreadySent.includes(option.airtableLabel) && true,
                    };
                  }),
                ]}
                selected={emailKey}
                onChange={(e) => onSelectedEmailChanged(e.target.value)}
              />
              <HorizontalSeparator className="fr-mb-3w" />
              <form
                onSubmit={submit}
                className="fr-col-12 fr-col-md-10 fr-col-lg-8 fr-col-xl-6"
              >
                <TextInput
                  required
                  label="Répondre à"
                  hint="Petite explication"
                  type="email"
                  value={emailContent.replyTo}
                  onChange={(e) =>
                    setEmailContentValue('replyTo', e.target.value)
                  }
                />
                <TextInput
                  label="Copie à"
                  hint="Les adresses emails doivent être séparées par des virgules"
                  value={emailContent?.cc}
                  onChange={(e) => setEmailContentValue('cc', e.target.value)}
                />
                <TextInput
                  required
                  label="Objet"
                  value={emailContent.object}
                  onChange={(e) =>
                    setEmailContentValue('object', e.target.value)
                  }
                />
                <TextInput
                  required
                  label="Corps"
                  textarea
                  value={emailContent.body}
                  onChange={(e) => setEmailContentValue('body', e.target.value)}
                  rows={10}
                />
                <TextInput
                  required
                  label="Signature"
                  hint="La signature sera sauvegardée pour le prochain envoi"
                  value={emailContent.signature}
                  onChange={(e) =>
                    setEmailContentValue('signature', e.target.value)
                  }
                />
                <Button className="fr-mt-2w" submit>
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
                  Veuillez ré-essayer
                </span>
              ) : (
                <span>Votre courriel a bien été envoyé !</span>
              )}
            </>
          )}
        </ModalContentWrapper>
      </ModalContent>
    </StyledModal>
  );
}

export default ModalEmails;
