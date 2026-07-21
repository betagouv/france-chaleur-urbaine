import Loader from '@/components/ui/Loader';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import { zUpdateNewsletterSchema } from '@/modules/users/constants';

/**
 * Form allowing the authenticated user to subscribe or unsubscribe from the FCU newsletter.
 * Syncs the preference with ADEME Connect.
 */
function ProfileNewsletterForm() {
  const { data: profile, isLoading } = trpc.users.getProfile.useQuery();
  const utils = trpc.useUtils();

  const updateNewsletter = trpc.users.updateNewsletterSubscription.useMutation({
    onError: (error) => {
      notify('error', error.message || 'Erreur lors de la mise à jour des préférences newsletter');
    },
    onSuccess: () => {
      notify('success', 'Préférences newsletter mises à jour');
      utils.users.getProfile.invalidate();
    },
  });

  const form = useAppForm({
    ...schemaValidation(zUpdateNewsletterSchema),
    defaultValues: {
      optin_newsletter: profile?.optin_at !== null && profile?.optin_at !== undefined,
    },
    onSubmit: async ({ value }) => {
      await updateNewsletter.mutateAsync(value);
    },
  });

  if (isLoading) {
    return <Loader variant="section" />;
  }

  return (
    <Form form={form}>
      <div className="flex flex-col gap-4">
        <form.AppField name="optin_newsletter">
          {(field) => <field.CheckboxField label="Je souhaite recevoir la newsletter France Chaleur Urbaine" />}
        </form.AppField>
        <div className="flex justify-end mt-4">
          <form.SubmitButton>Enregistrer</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
}

export default ProfileNewsletterForm;
