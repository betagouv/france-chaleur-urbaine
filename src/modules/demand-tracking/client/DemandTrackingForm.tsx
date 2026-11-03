import { TRPCClientError } from '@trpc/client';
import { useState } from 'react';

import { clientConfig } from '@/client-config';
import Alert from '@/components/ui/Alert';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { type DemandTrackingPlacement, zRequestDemandTrackingInput } from '../constants';

type DemandTrackingFormProps = {
  /** Where the form is embedded, reported to PostHog (`emplacement`). */
  placement: DemandTrackingPlacement;
};

const isRateLimitError = (error: unknown) => error instanceof TRPCClientError && error.data?.code === 'TOO_MANY_REQUESTS';

/**
 * Email field + "Suivre ma demande" button. After submit, the same confirmation is shown whether or not
 * a demand matches the address, and even when the hourly cap is reached: nothing is revealed on screen.
 */
export function DemandTrackingForm({ placement }: DemandTrackingFormProps) {
  const { mutateAsync: requestDemandTracking } = trpc.demandTracking.request.useMutation();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useAppForm({
    ...schemaValidation(zRequestDemandTrackingInput),
    defaultValues: { email: '' },
    onSubmit: toastErrors(async ({ value }) => {
      try {
        await requestDemandTracking({ email: value.email });
      } catch (error) {
        if (!isRateLimitError(error)) {
          throw error;
        }
      }
      trackPostHogEvent('suivi_demande:form_submitted', { emplacement: placement });
      setSubmittedEmail(value.email);
    }),
  });

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
