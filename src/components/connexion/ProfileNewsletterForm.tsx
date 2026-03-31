import useForm from '@/components/form/react-form/useForm';
import Loader from '@/components/ui/Loader';
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

  const { Checkbox, Submit, Form } = useForm({
    defaultValues: {
      optin_newsletter: profile?.optin_at !== null && profile?.optin_at !== undefined,
    },
    onSubmit: async ({ value }) => {
      await updateNewsletter.mutateAsync(value);
    },
    schema: zUpdateNewsletterSchema,
  });

  if (isLoading) {
    return <Loader variant="section" />;
  }

  return (
    <Form>
      <div className="flex flex-col gap-4">
        <Checkbox name="optin_newsletter" label="Je souhaite recevoir la newsletter France Chaleur Urbaine" />
        <div className="flex justify-end mt-4">
          <Submit disabled={updateNewsletter.isPending}>{updateNewsletter.isPending ? 'Enregistrement...' : 'Enregistrer'}</Submit>
        </div>
      </div>
    </Form>
  );
}

export default ProfileNewsletterForm;
