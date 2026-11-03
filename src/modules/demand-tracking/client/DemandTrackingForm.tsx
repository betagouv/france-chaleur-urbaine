import { useState } from 'react';

import { clientConfig } from '@/client-config';
import Alert from '@/components/ui/Alert';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { useFormTracking } from '@/modules/form/useFormTracking';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { type DemandTrackingFormSource, zRequestDemandTrackingInput } from '../constants';

type DemandTrackingFormProps = {
  /** Where the form is embedded, reported to PostHog (`source`). */
  source: DemandTrackingFormSource;
};

/**
 * Email field + "Suivre ma demande" button. After submit, the same confirmation is shown whether or not
 * a demand matches the address: nothing is revealed on screen. Beyond the hourly cap, the tRPC link
 * toasts the `TOO_MANY_REQUESTS` error and the form stays displayed.
 */
export function DemandTrackingForm({ source }: DemandTrackingFormProps) {
  const { mutateAsync: requestDemandTracking } = trpc.demandTracking.request.useMutation();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useAppForm({
    ...schemaValidation(zRequestDemandTrackingInput),
    defaultValues: { email: '' },
    onSubmit: toastErrors(async ({ value }) => {
      await requestDemandTracking({ email: value.email });
      setSubmittedEmail(value.email);
    }),
  });
  useFormTracking(form, { formName: 'suivi_demande', source });

  if (submittedEmail) {
    return (
      <Alert variant="info" size="sm">
        Si une ou plusieurs demandes sont associées à <strong>{submittedEmail}</strong>, vous allez recevoir un email de{' '}
        <strong>{clientConfig.noReplyEmail}</strong> dans quelques minutes. Pensez à vérifier vos courriers indésirables. Vous ne le recevez
        pas ? Vérifiez que vous avez saisi l'adresse utilisée lors de votre demande.
      </Alert>
    );
  }

  return (
    <Form form={form}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex-1">
          <form.AppField name="email">
            {(field) => (
              <field.EmailField
                label="Email utilisé lors de votre demande"
                hintText="Format attendu : nom@domaine.fr"
                className="mb-0!"
                nativeInputProps={{ placeholder: 'nom@domaine.fr' }}
              />
            )}
          </form.AppField>
        </div>
        <form.SubmitButton iconId="fr-icon-arrow-right-line" iconPosition="right" className="shrink-0">
          Suivre ma demande
        </form.SubmitButton>
      </div>
    </Form>
  );
}
