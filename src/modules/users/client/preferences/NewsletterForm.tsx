import { z } from 'zod';

import Loader from '@/components/ui/Loader';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

const zNewsletter = z.object({
  optin_newsletter: z.boolean(),
});

/**
 * Newsletter opt-in of the authenticated user, saved as soon as the choice changes and synced with ADEME Connect.
 */
function NewsletterForm() {
  const { data: profile, isLoading } = trpc.users.getProfile.useQuery();
  const utils = trpc.useUtils();

  const updateNewsletter = trpc.users.updateNewsletterSubscription.useMutation({
    onError: (error) => notify('error', error.message || 'Erreur lors de la mise à jour des préférences newsletter'),
    onSuccess: () => utils.users.getProfile.invalidate(),
  });

  const form = useAppForm({
    ...schemaValidation(zNewsletter),
    defaultValues: {
      optin_newsletter: profile?.optin_at !== null && profile?.optin_at !== undefined,
    },
  });

  if (isLoading || !profile) {
    return <Loader variant="section" />;
  }

  return (
    <Form form={form}>
      <form.AppField
        name="optin_newsletter"
        listeners={{
          onChange: ({ value }) => {
            updateNewsletter.mutate({ optin_newsletter: value });
            trackPostHogEvent('account:preference_updated', { preference: 'newsletter', value });
          },
        }}
      >
        {(field) => <field.CheckboxField label="Je souhaite recevoir la newsletter France Chaleur Urbaine" />}
      </form.AppField>
    </Form>
  );
}

export default NewsletterForm;
