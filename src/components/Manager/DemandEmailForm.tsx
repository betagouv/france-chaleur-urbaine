import dayjs from 'dayjs';
import { type FormEvent, useEffect, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import TextArea from '@/components/form/dsfr/TextArea';
import Button from '@/components/ui/Button';
import CrudDropdown from '@/components/ui/CrudDropdown';
import Loader from '@/components/ui/Loader';
import { useFetch } from '@/hooks/useApi';
import { type ManagerEmailResponse } from '@/pages/api/managerEmail';
import { type EmailTemplatesResponse } from '@/pages/api/user/email-templates/[[...slug]]';
import { useUserPreferences } from '@/services/authentication';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { type Demand } from '@/types/Summary/Demand';
import { isUUID } from '@/utils/core';

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
  const [isSending, setIsSending] = useState(false);
  const [sentError, setSentError] = useState(false);

  const {
    data: sentHistory,
    isLoading: isLoadingSentHistory,
    refetch,
  } = useFetch<ManagerEmailResponse>(`/api/managerEmail?demand_id=${props.currentDemand.id}`);

  useEffect(() => {
    if (userPreferences) {
      setEmailContent(getDefaultEmailContent());
    }
  }, [userPreferences]);

  const { data: emailTemplatesData } = useFetch<EmailTemplatesResponse['list']>(`/api/user/email-templates`);

  const { items: emailTemplates = [] } = emailTemplatesData || { count: 0, items: [] };

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
    const emailTemplate = emailTemplates.find((emailTemplate) => emailTemplate.id === emailKey);
    setEmailKey(emailKey);
    setEmailContentValue('object', emailTemplate?.subject || '');
    const body = emailTemplate?.body || '';
    setEmailContentValue('body', body);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
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

      refetch();

      //Add email in Airtable demands list
      alreadySent.push(emailContent.object);
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
    } finally {
      setIsSending(false);
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
                sentHistory.map((item, index) => {
                  const emailTemplate = emailTemplates.find((emailTemplate) => emailTemplate.id === item.email_key);
                  return (
                    <li key={index}>
                      <span>{emailTemplate?.name}</span> -{' '}
                      <small className="text-faded italic">
                        envoyé le <time dateTime={item.date}>{dayjs(item.date).format('dddd D MMMM YYYY')}</time>
                      </small>
                    </li>
                  );
                })
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
                  <CrudDropdown<EmailTemplatesResponse>
                    url="/api/user/email-templates"
                    valueKey="id"
                    nameKey="name"
                    data={{
                      subject: emailContent.object,
                      body: emailContent.body,
                    }}
                    onSelect={(item) => {
                      onSelectedEmailChanged(item.id);
                    }}
                    preprocessItem={(item) => ({
                      ...item,
                      editable: isUUID(item.id),
                      disabled: !!(
                        sentHistory &&
                        Array.isArray(sentHistory) &&
                        sentHistory.some((email: any) => email.email_key === item.id)
                      ),
                    })}
                  />
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
            <Button className="fr-mt-2w" type="submit" loading={isSending}>
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
