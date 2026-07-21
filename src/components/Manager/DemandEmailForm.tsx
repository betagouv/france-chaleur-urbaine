import { useStore } from '@tanstack/react-form';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import Input from '@/components/form/dsfr/Input';
import Alert from '@/components/ui/Alert';
import { copyToClipboard } from '@/components/ui/ButtonCopy';
import CrudDropdown from '@/components/ui/CrudDropdown';
import Icon from '@/components/ui/Icon';
import Tooltip, { TooltipIcon } from '@/components/ui/Tooltip';
import { useFetch } from '@/hooks/useApi';
import { useUserPreferences } from '@/modules/auth/client/hooks';
import EmailHistory from '@/modules/demands/client/EmailHistory';
import type { Demand } from '@/modules/demands/types';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import trpc from '@/modules/trpc/client';
import type { EmailTemplatesResponse } from '@/pages/api/user/email-templates/[[...slug]]';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { isUUID } from '@/utils/core';
import { ObjectKeys } from '@/utils/typescript';

type Props = {
  currentDemand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
  /** Notifie le parent quand le contenu diffère des valeurs pré-remplies (pour confirmer avant fermeture). */
  onDirtyChange?: (isDirty: boolean) => void;
};

const zDemandEmail = z.object({
  body: z.string().min(1, 'Ce champ est obligatoire'),
  cc: z
    .string()
    .optional()
    .refine((value) => !value || value.split(',').every((email) => z.email().safeParse(email.trim()).success), {
      message: 'Les adresses email doivent être valides et séparées par des virgules',
    }),
  object: z.string().min(1, 'Ce champ est obligatoire'),
  replyTo: z.email("L'adresse email n'est pas valide"),
  signature: z.string().min(1, 'Ce champ est obligatoire'),
});

type EmailContent = z.input<typeof zDemandEmail>;

/**
 * Processes a string value by replacing placeholders with values from the current demand
 * Placeholders are in the format {{key}} where key is a property of the demand object
 */
function processPlaceholders(value: string, demand: Demand): string {
  let processedValue = value;

  Object.entries(demand).forEach(([key, val]) => {
    if (processedValue.includes(`{{${key}}}`)) {
      let formattedValue: string;
      if (typeof val === 'string') {
        // Check if the string looks like a date
        if (val.match(/^\d{4}-\d{2}-\d{2}/) || val.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          // Format date strings to a human-readable format
          formattedValue = dayjs(val).format(`D MMMM YYYY${val.includes('T') ? ' [à] HH[h]mm' : ''}`);
        } else {
          formattedValue = val.trim();
        }
      } else {
        formattedValue = val?.toString() ?? '';
      }
      processedValue = processedValue.replace(new RegExp(`{{${key}}}`, 'gi'), formattedValue);
    }
  });

  return processedValue;
}

function DemandEmailForm(props: Props) {
  const { userPreferences, updateUserPreferences } = useUserPreferences();

  const getDefaultEmailContent = (): EmailContent => {
    return {
      body: '',
      cc: userPreferences?.email || '',
      object: '',
      replyTo: userPreferences?.email || '',
      signature: userPreferences?.signature || '',
    };
  };

  const [alreadySent, setAlreadySent] = useState<string[]>([]);
  const [emailKey, setEmailKey] = useState('');
  const initialContentRef = useRef(getDefaultEmailContent());
  const [sent, setSent] = useState(false);
  const [sentError, setSentError] = useState(false);

  const {
    data: sentHistory,
    isLoading: isLoadingSentHistory,
    refetch,
  } = trpc.demands.gestionnaire.listEmails.useQuery({ demand_id: props.currentDemand.id });

  const sendEmailMutation = trpc.demands.gestionnaire.sendEmail.useMutation();

  const form = useAppForm({
    ...schemaValidation(zDemandEmail),
    defaultValues: initialContentRef.current,
    onSubmit: async ({ value }) => {
      //Save content in DB
      try {
        await sendEmailMutation.mutateAsync({
          demand_id: props.currentDemand.id,
          emailContent: {
            ...value,
            body: processPlaceholders(value.body, props.currentDemand),
            cc: value.cc ?? '',
            object: processPlaceholders(value.object, props.currentDemand),
            to: props.currentDemand.Mail,
          },
          key: emailKey,
        });

        void refetch();

        //Add email in Airtable demands list
        alreadySent.push(value.object);
        const updatedFields: any = {
          'Emails envoyés': alreadySent.join('\n'),
        };
        if (emailKey === 'koFarFromNetwok' || emailKey === 'koIndividualHeat' || emailKey === 'koOther') {
          updatedFields.Status = DEMANDE_STATUS.UNREALISABLE;
        } else if (emailKey === 'askForPieces') {
          updatedFields.Status = DEMANDE_STATUS.RECONTACTED;
        }
        await props.updateDemand(props.currentDemand.id, updatedFields);

        //Update the current user signature
        if (userPreferences && userPreferences.signature !== value.signature) {
          void updateUserPreferences({ signature: value.signature });
        }

        setSent(true);
      } catch (_err: any) {
        setSentError(true);
      }
    },
  });

  const bodyValue = useStore(form.store, (state) => state.values.body);
  const objectValue = useStore(form.store, (state) => state.values.object);
  const formValues = useStore(form.store, (state) => state.values);

  useEffect(() => {
    if (userPreferences) {
      const defaultContent = getDefaultEmailContent();
      initialContentRef.current = defaultContent;
      form.reset(defaultContent);
    }
  }, [userPreferences]);

  const isDirty = !sent && !sentError && ObjectKeys(formValues).some((key) => formValues[key] !== initialContentRef.current[key]);

  useEffect(() => {
    props.onDirtyChange?.(isDirty);
  }, [isDirty, props.onDirtyChange]);

  const { data: emailTemplatesData } = useFetch<EmailTemplatesResponse['list']>(`/api/user/email-templates`);

  const { items: emailTemplates = [] } = emailTemplatesData || { count: 0, items: [] };

  useEffect(() => {
    if (props.currentDemand['Emails envoyés']) {
      setAlreadySent(props.currentDemand['Emails envoyés'].split('\n'));
    }
  }, [props.currentDemand]);

  const onSelectedEmailChanged = (emailKey: string) => {
    const emailTemplate = emailTemplates.find((emailTemplate) => emailTemplate.id === emailKey);
    setEmailKey(emailKey);
    form.setFieldValue('object', emailTemplate?.subject || '', { dontUpdateMeta: true });
    form.setFieldValue('body', emailTemplate?.body || '', { dontUpdateMeta: true });
  };

  const authorizedReplaceableKeys = Object.keys(props.currentDemand).filter((key) =>
    [
      'Prénom',
      'Nom',
      'Adresse',
      'Mail',
      'Date de la demande',
      'Distance au réseau',
      'Structure',
      'Logement',
      'Surface en m2',
      'Mode de chauffage',
      'Type de chauffage',
      'Conso',
    ].includes(key)
  );

  return (
    <div>
      {!sent && !sentError ? (
        <>
          <div className="w-full border border-solid border-gray-200" />
          <EmailHistory emails={sentHistory ?? null} isLoading={isLoadingSentHistory} onEmailClick={onSelectedEmailChanged} />
          <div className="fr-mb-3w w-full border border-solid border-gray-200" />
          <Form form={form}>
            <Input
              label="À"
              disabled
              nativeInputProps={{
                defaultValue: props.currentDemand.Mail,
                type: 'email',
              }}
            />
            <form.AppField name="replyTo">{(field) => <field.EmailField label="Répondre à" />}</form.AppField>
            <form.AppField name="cc">
              {(field) => (
                <field.EmailField
                  label="Copie à"
                  hintText="Les adresses emails doivent être séparées par des virgules"
                  nativeInputProps={{ multiple: true }}
                />
              )}
            </form.AppField>
            <form.AppField name="object">
              {(field) => (
                <field.TextField
                  label={
                    <div className="flex items-center justify-between gap-2">
                      <span>Objet</span>
                      <div className="flex items-center gap-1">
                        <Tooltip
                          className="max-w-xl min-w-[300px]"
                          title={
                            <div className="max-h-96 overflow-y-auto">
                              <p className="text-sm">
                                Vous pouvez utiliser des variables dans l'objet et le corps du courriel.
                                <br />
                                Si vous sauvegardez votre modèle de message pour traiter de futures demandes, ces variables reprendront
                                automatiquement les informations des demandes concernées.
                              </p>
                              <p className="font-bold text-sm">
                                Cliquez sur une variable pour l'insérer dans le corps de votre message et le copier dans votre
                                presse-papiers.
                              </p>
                              <ul>
                                {authorizedReplaceableKeys.map((authorizedTemplateKey) => {
                                  const templateKey = `{{${authorizedTemplateKey}}}`;
                                  return (
                                    <li key={authorizedTemplateKey}>
                                      <strong
                                        onClick={() => {
                                          form.setFieldValue('body', `${form.getFieldValue('body')} ${templateKey}`, {
                                            dontUpdateMeta: true,
                                          });
                                          copyToClipboard(templateKey);
                                        }}
                                        className="cursor-pointer hover:bg-gray-200 rounded-xs p-1"
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
                          addLabel="Ajouter un modèle"
                          addPlaceholderLabel="Nom de mon modèle"
                          data={{
                            body: bodyValue,
                            subject: objectValue,
                          }}
                          onSelect={(item) => onSelectedEmailChanged(item.id)}
                          preprocessItem={(item) => ({
                            ...item,
                            disabled: !!(
                              sentHistory &&
                              Array.isArray(sentHistory) &&
                              sentHistory.some((email: any) => email.email_key === item.id)
                            ),
                            editable: isUUID(item.id),
                          })}
                        />
                      </div>
                    </div>
                  }
                />
              )}
            </form.AppField>
            <form.AppField name="body">{(field) => <field.TextareaField label="Corps" nativeTextAreaProps={{ rows: 10 }} />}</form.AppField>
            {bodyValue && !bodyValue.includes('{{Adresse}}') && (
              <Alert variant="warning" size="sm" className="fr-mb-2w">
                Votre message ne contient pas la variable <code>{'{{Adresse}}'}</code>. Sans cette information, l'usager ne pourra pas
                identifier de quelle adresse il s'agit.
              </Alert>
            )}
            <form.AppField name="signature">
              {(field) => <field.TextField label="Signature" hintText="La signature sera sauvegardée pour le prochain envoi" />}
            </form.AppField>
            <div className="flex items-center gap-2 fr-mt-2w">
              <form.SubmitButton>Envoyer</form.SubmitButton>
              <Tooltip
                className="max-w-xl min-w-[300px]"
                title={
                  <div className="max-h-96 overflow overflow-auto">
                    <div className="text-sm italic mb-1">Prévisualisation du courriel</div>
                    <div className="p-2 border border-dashed border-gray-200 bg-gray-50">
                      <h4 className="font-mono text-sm">
                        {objectValue ? processPlaceholders(objectValue, props.currentDemand) : "Remplissez l'objet"}
                      </h4>
                      <p className="whitespace-pre-line font-mono text-sm">
                        {bodyValue ? processPlaceholders(bodyValue, props.currentDemand) : 'Remplissez le corps'}
                      </p>
                    </div>
                  </div>
                }
              >
                <span className="flex items-center gap-1 cursor-help underline text-sm">
                  <TooltipIcon name="ri-slideshow-line" /> Prévisualiser le courriel
                </span>
              </Tooltip>
            </div>
          </Form>
        </>
      ) : sentError ? (
        <span>
          Il y a eu une erreur au cours de votre envoi.
          <br />
          Veuillez ré-essayer.
        </span>
      ) : (
        <span>Votre courriel a bien été envoyé !</span>
      )}
    </div>
  );
}

export default DemandEmailForm;
