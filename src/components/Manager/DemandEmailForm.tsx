import { Button } from '@codegouvfr/react-dsfr/Button';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { type FormEvent, useEffect, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import TextArea from '@/components/form/dsfr/TextArea';
import Loader from '@/components/ui/Loader';
import emailsContentList from '@/data/manager/manager-emails-content';
import emailsList from '@/data/manager/manager-emails-list';
import { useFetch } from '@/hooks/useApi';
import { type ManagerEmailResponse } from '@/pages/api/managerEmail';
import { useUserPreferences } from '@/services/authentication';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { type Demand } from '@/types/Summary/Demand';

type Props = {
  currentDemand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
};
type EmailContent = {
  object: string;
  to: string;
  body: string;
  signature: string;
  cc: string;
  replyTo: string;
};
function DemandEmailForm(props: Props) {
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

  const [alreadySent, setAlreadySent] = useState<string[]>([]);
  const [emailKey, setEmailKey] = useState('');
  const [emailContent, setEmailContent] = useState<EmailContent>(getDefaultEmailContent());
  const [sent, setSent] = useState(false);
  const [sentError, setSentError] = useState(false);

  const { data: sentHistory, isLoading: isLoadingSentHistory } = useFetch<ManagerEmailResponse>(
    `/api/managerEmail?demand_id=${props.currentDemand.id}`
  );

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
    <div>
      {!sent && !sentError ? (
        <>
          <div className="w-full border border-solid border-gray-200" />
          <div className="fr-mt-3w fr-mb-3w">
            <b>Historique</b>
            <br />
            <ul className="fr-ml-3w">
              {isLoadingSentHistory ? (
                <li>
                  <Loader size="sm" />
                </li>
              ) : sentHistory && sentHistory.length > 0 ? (
                sentHistory.map((item, index) => (
                  <li key={index}>
                    {getLabel(item.email_key as string)} envoyé le {item.date}
                  </li>
                ))
              ) : (
                <li>Aucun courriel envoyé</li>
              )}
            </ul>
          </div>
          <div className="fr-mb-3w w-full border border-solid border-gray-200" />
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
              label={
                <div className="flex items-center justify-between gap-2">
                  <span>Objet</span>
                  <span>
                    <Select
                      label=""
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
                  </span>
                </div>
              }
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
    </div>
  );
}

export default DemandEmailForm;
