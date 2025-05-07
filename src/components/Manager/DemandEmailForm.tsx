import dayjs from 'dayjs';
import { type FormEvent, useEffect, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import TextArea from '@/components/form/dsfr/TextArea';
import Button from '@/components/ui/Button';
import CrudDropdown from '@/components/ui/CrudDropdown';
import Icon from '@/components/ui/Icon';
import Loader from '@/components/ui/Loader';
import Tooltip, { TooltipIcon } from '@/components/ui/Tooltip';
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

/**
 * Processes a string value by replacing placeholders with values from the current demand
 * Placeholders are in the format {{key}} where key is a property of the demand object
 */
function processPlaceholders(value: string, demand: Demand): string {
  let processedValue = value;

  Object.entries(demand).forEach(([key, val]) => {
    if (processedValue.includes(`{{${key}}}`)) {
      let formattedValue;
      if (typeof val === 'string') {
        // Check if the string looks like a date
        if (val.match(/^\d{4}-\d{2}-\d{2}/) || val.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          // Format date strings to a human-readable format
          formattedValue = dayjs(val).format('D MMMM YYYY' + (val.includes('T') ? ' [à] HH[h]mm' : ''));
        } else {
          formattedValue = val.trim();
        }
      } else {
        formattedValue = val.toString();
      }
      processedValue = processedValue.replace(new RegExp(`{{${key}}}`, 'gi'), formattedValue);
    }
  });

  return processedValue;
}

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
    setEmailContentValue('body', emailTemplate?.body || '');
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    //Save content in DB
    try {
      const res = await fetch(`/api/managerEmail`, {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            ...emailContent,
            object: processPlaceholders(emailContent.object, props.currentDemand),
            body: processPlaceholders(emailContent.body, props.currentDemand),
          },
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

  const authorizedReplaceableKeys = Object.keys(props.currentDemand)
    .filter(
      (key) =>
        ![
          'id',
          'Relance ID',
          'haut_potentiel',
          'Relance à activer',
          'Gestionnaires',
          'Emails envoyés',
          'Éligibilité',
          'Gestionnaires validés',
        ].includes(key)
    )
    .sort((a, b) => a.localeCompare(b));

  return (
    <div>
      {!sent && !sentError ? (
        <>
          <div className="w-full border border-solid border-gray-200" />
          <section className="fr-mt-3w fr-mb-3w">
            <h4>Historique</h4>
            <ul className="fr-ml-3w">
              {isLoadingSentHistory ? (
                <li>
                  <Loader size="sm" />
                </li>
              ) : sentHistory && sentHistory.length > 0 ? (
                sentHistory.map((item, index) => {
                  const object = item.object;
                  return (
                    <li key={index} onClick={() => onSelectedEmailChanged(item.email_key as string)} className="cursor-pointer">
                      <Tooltip
                        className="max-w-[600px] min-w-[300px]"
                        title={
                          <div className="max-h-96 overflow overflow-auto">
                            <div className="text-sm mb-1">
                              À: <strong>{item.to}</strong>
                            </div>
                            {item.cc && (
                              <div className="text-sm mb-1">
                                Copie à: <strong>{item.cc}</strong>
                              </div>
                            )}
                            <div className="text-sm mb-1">
                              Répondre à: <strong>{item.reply_to}</strong>
                            </div>
                            <div className="p-2 border border-dashed border-gray-200 bg-gray-50">
                              <h4 className="font-mono text-sm">{item.object}</h4>
                              <p className="whitespace-pre-line font-mono text-sm">{item.body.replaceAll('<br />', '\n')}</p>
                            </div>
                          </div>
                        }
                      >
                        <span>
                          <span className="underline cursor-help">{object}</span> -{' '}
                          <small className="text-faded italic">
                            envoyé le <time dateTime={item.date}>{dayjs(item.date).format('dddd D MMMM YYYY')}</time>
                          </small>
                        </span>
                      </Tooltip>
                    </li>
                  );
                })
              ) : (
                <li>Aucun courriel envoyé</li>
              )}
            </ul>
          </section>
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
                  <div className="flex items-center gap-1">
                    <Tooltip
                      className="max-w-[600px] min-w-[300px]"
                      title={
                        <div className="max-h-96 overflow-y-auto">
                          <p className="text-sm">
                            Vous pouvez utiliser des variables dans l'objet et le corps du courriel.
                            <br />
                            Si vous sauvegardez votre modèle de message pour traiter de futures demandes, ces variables reprendront
                            automatiquement les informations des demandes concernées.
                          </p>
                          <hr />
                          <p className="text-sm mb-1">Les variables disponibles sont :</p>
                          <p className="text-xs italic font-bold">
                            Cliquez sur une variable pour l'insérer dans le corps de votre message et le copier dans votre presse-papiers.
                          </p>
                          <ul>
                            {authorizedReplaceableKeys.map((authorizedTemplateKey) => {
                              const templateKey = `{{${authorizedTemplateKey}}}`;
                              return (
                                <li key={authorizedTemplateKey}>
                                  <strong
                                    onClick={() => {
                                      setEmailContentValue('body', `${emailContent.body} ${templateKey}`);
                                      navigator.clipboard.writeText(templateKey).catch();
                                    }}
                                    className="cursor-pointer hover:bg-gray-200 rounded-sm p-1"
                                  >
                                    &#123;&#123;{authorizedTemplateKey}&#125;&#125;
                                  </strong>
                                  : {processPlaceholders(templateKey, props.currentDemand)}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      }
                    >
                      <span className="flex items-center gap-1 cursor-help">
                        <Icon name="ri-question-line" />
                        <span className="text-faded underline text-xs">Utiliser des variables</span>
                      </span>
                    </Tooltip>
                    <CrudDropdown<EmailTemplatesResponse>
                      url="/api/user/email-templates"
                      valueKey="id"
                      nameKey="name"
                      loadLabel="Modèles de réponse"
                      saveLabel="Sauvegarder mon modèle"
                      addLabel="Nom de mon modèle"
                      data={{
                        ...(emailContent.object && { subject: emailContent.object }),
                        ...(emailContent.body && { body: emailContent.body }),
                      }}
                      onSelect={(item) => onSelectedEmailChanged(item.id)}
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
            <div className="flex items-center gap-2 fr-mt-2w">
              <Button type="submit" loading={isSending}>
                Envoyer
              </Button>
              <Tooltip
                className="max-w-[600px] min-w-[300px]"
                title={
                  <div className="max-h-96 overflow overflow-auto">
                    <div className="text-sm italic mb-1">Prévisualisation du courriel</div>
                    <div className="p-2 border border-dashed border-gray-200 bg-gray-50">
                      <h4 className="font-mono text-sm">
                        {emailContent.object ? processPlaceholders(emailContent.object, props.currentDemand) : "Remplissez l'objet"}
                      </h4>
                      <p className="whitespace-pre-line font-mono text-sm">
                        {emailContent.body ? processPlaceholders(emailContent.body, props.currentDemand) : 'Remplissez le corps'}
                      </p>
                    </div>
                  </div>
                }
              >
                <span className="flex items-center gap-1 cursor-help underline text-sm">
                  <TooltipIcon name="ri-eye-line" /> Prévisualiser le courriel
                </span>
              </Tooltip>
            </div>
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
