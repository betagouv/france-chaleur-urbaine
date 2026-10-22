import { useStore } from '@tanstack/react-form';
import { useRef } from 'react';

import Input from '@/components/form/dsfr/Input';
import Button from '@/components/ui/Button';
import CrudDropdown from '@/components/ui/CrudDropdown';
import Icon from '@/components/ui/Icon';
import Tooltip from '@/components/ui/Tooltip';
import { useAuthentication } from '@/modules/auth/client/hooks';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { UserPreferences } from '@/modules/users/constants';
import type { EmailTemplatesResponse } from '@/pages/api/user/email-templates/[[...slug]]';
import { isUUID } from '@/utils/core';

import { zCcrtEmailForm } from '../constants';
import type { CcrtDemand } from '../types';
import { CcrtEmailSignature } from './CcrtEmailSignature';
import { invalidateCcrtDemand } from './ccrt-demand-cache';

type CcrtDemandEmailFormProps = { demand: CcrtDemand; onClose: () => void; preferences: UserPreferences };

/**
 * Reuses site email templates and personal signatures with an idempotent SMTP send.
 */
export function CcrtDemandEmailForm({ demand, onClose, preferences }: CcrtDemandEmailFormProps) {
  const { user } = useAuthentication();
  const messageId = useRef(crypto.randomUUID());
  const utils = trpc.useUtils();
  const mutation = trpc.batEnr.ccrt.sendEmail.useMutation();
  const variables = { Adresse: demand.address, Mail: demand.email, Nom: demand.last_name, Prénom: demand.first_name };
  const replacePlaceholders = (value: string) =>
    Object.entries(variables).reduce((text, [key, replacement]) => text.replaceAll(`{{${key}}}`, replacement), value);
  const form = useAppForm({
    ...schemaValidation(zCcrtEmailForm),
    defaultValues: {
      body: '',
      cc: user?.email ?? '',
      object: `Votre demande d’accompagnement — ${demand.address}`,
      replyTo: user?.email ?? '',
      signature: preferences.email_signature ?? '',
      updateStatusOnSend: true,
    },
    onSubmit: toastErrors(async ({ value }) => {
      const { updateStatusOnSend, ...emailContent } = value;
      await mutation.mutateAsync({
        demandId: demand.id,
        emailContent: { ...emailContent, body: replacePlaceholders(value.body), object: replacePlaceholders(value.object) },
        messageId: messageId.current,
        updateStatusOnSend,
      });
      await Promise.all([utils.users.getPreferences.invalidate(), invalidateCcrtDemand(utils, demand.id)]);
      onClose();
    }),
  });
  const content = useStore(form.store, (state) => ({ body: state.values.body, subject: state.values.object }));

  return (
    <Form form={form}>
      <fieldset disabled={mutation.isPending} className="m-0 border-0 p-0">
        <legend className="sr-only">Nouveau message</legend>
        <Input label="Destinataire" hideOptionalLabel disabled nativeInputProps={{ type: 'email', value: demand.email }} />
        <form.AppField name="replyTo">{(field) => <field.EmailField label="De" />}</form.AppField>
        <form.AppField name="cc">
          {(field) => (
            <field.EmailField
              label="Copie à (optionnel)"
              hideOptionalLabel
              hintText="Les adresses email doivent être séparées par des virgules"
              nativeInputProps={{ multiple: true }}
            />
          )}
        </form.AppField>
        <form.AppField name="object">{(field) => <field.TextField label="Objet" />}</form.AppField>
        <form.AppField name="body">
          {(field) => <field.TextareaField label="Message" nativeTextAreaProps={{ maxLength: 20000, rows: 3 }} />}
        </form.AppField>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Tooltip
            title={
              <>
                <p>Ces variables sont remplacées dans l’objet et le message à l’envoi. Cliquez pour les insérer.</p>
                {Object.entries(variables).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    className="mb-2 block text-left underline"
                    onClick={() => form.setFieldValue('body', `${form.getFieldValue('body')} {{${key}}}`)}
                  >
                    {`{{${key}}}`} : {value}
                  </button>
                ))}
              </>
            }
          >
            <button type="button" className="flex items-center gap-1 text-xs text-(--text-mention-grey) underline">
              <Icon name="fr-icon-information-line" size="sm" /> Utiliser des variables
            </button>
          </Tooltip>
          <CrudDropdown<EmailTemplatesResponse>
            url="/api/user/email-templates"
            valueKey="id"
            nameKey="name"
            data={content}
            preprocessItem={(item) => ({ ...item, disabled: false, editable: isUUID(item.id) })}
            triggerLabel="Enregistrer / utiliser un modèle"
            addLabel="Ajouter un modèle"
            addPlaceholderLabel="Nom de mon modèle"
            onSelect={(template) => {
              form.setFieldValue('object', template.subject, { dontUpdateMeta: true });
              form.setFieldValue('body', template.body, { dontUpdateMeta: true });
            }}
          />
        </div>
        <form.AppField name="signature">
          {(field) => <field.CustomField Component={CcrtEmailSignature} savedSignature={preferences.email_signature ?? ''} />}
        </form.AppField>
        <form.AppField name="updateStatusOnSend">
          {(field) => <field.CheckboxField label="Passer la demande à « En cours » à l’envoi" />}
        </form.AppField>
      </fieldset>
      <div className="mt-6 flex justify-end gap-4 border-t border-(--border-default-grey) pt-6">
        <Button priority="secondary" size="large" disabled={mutation.isPending} onClick={onClose}>
          Annuler
        </Button>
        <form.SubmitButton size="large" disabled={mutation.isPending} iconId="fr-icon-mail-line" iconPosition="right">
          Envoyer
        </form.SubmitButton>
      </div>
    </Form>
  );
}
