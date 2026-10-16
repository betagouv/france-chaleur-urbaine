import { z } from 'zod';

import Loader from '@/components/ui/Loader';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

const zEmailSignature = z.object({
  email_signature: z.string().trim(),
});

/**
 * Email signature of the authenticated user (`users.preferences.email_signature`),
 * pre-filled in the emails sent to demand contacts from the manager space.
 */
function EmailSignatureForm() {
  const { data: preferences, isLoading } = trpc.users.getPreferences.useQuery();
  const utils = trpc.useUtils();

  const updatePreferences = trpc.users.updatePreferences.useMutation({
    onError: (error) => notify('error', error.message || 'Erreur lors de la mise à jour de la signature'),
    onSuccess: () => {
      notify('success', 'Signature enregistrée');
      void utils.users.getPreferences.invalidate();
    },
  });

  const form = useAppForm({
    ...schemaValidation(zEmailSignature),
    defaultValues: {
      email_signature: preferences?.email_signature ?? '',
    },
    onSubmit: async ({ value }) => {
      await updatePreferences.mutateAsync({ email_signature: value.email_signature || null });
      trackPostHogEvent('account:preference_updated', { preference: 'email_signature' });
    },
  });

  if (isLoading) {
    return <Loader variant="section" />;
  }

  return (
    <Form form={form}>
      <div className="flex flex-col gap-4">
        <form.AppField name="email_signature">
          {(field) => (
            <field.TextareaField
              label="Signature"
              hintText="Pré-remplie dans les emails que vous envoyez aux demandeurs depuis votre espace. Elle est aussi mise à jour à chaque envoi."
              nativeTextAreaProps={{ rows: 4 }}
            />
          )}
        </form.AppField>
        <div className="flex justify-end">
          <form.SubmitButton>Enregistrer la signature</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
}

export default EmailSignatureForm;
