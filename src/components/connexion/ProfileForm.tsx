import useForm from '@/components/form/react-form/useForm';
import Loader from '@/components/ui/Loader';
import Notice from '@/components/ui/Notice';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import { roles, structureTypes, updateProfileDefaultValues, zUpdateProfileSchema } from '@/modules/users/constants';

function ProfileForm() {
  const { data: profile, isLoading } = trpc.users.getProfile.useQuery();
  const utils = trpc.useUtils();

  const updateProfile = trpc.users.updateProfile.useMutation({
    onError: (error: { message?: string }) => {
      notify('error', error.message || 'Erreur lors de la mise à jour du profil');
    },
    onSuccess: () => {
      notify('success', 'Profil mis à jour avec succès');
      utils.users.getProfile.invalidate();
    },
  });

  const { Input, Submit, Form, Select, PhoneInput, useValue } = useForm({
    defaultValues: {
      ...updateProfileDefaultValues,
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      phone: profile?.phone ?? null,
      structure_name: profile?.structure_name ?? '',
      structure_other: profile?.structure_other ?? '',
      structure_type: profile?.structure_type ?? '',
    },
    onSubmit: async ({ value }) => {
      await updateProfile.mutateAsync(value);
    },
    schema: zUpdateProfileSchema,
  });

  const structureType = useValue('structure_type');
  const showStructureFields = profile?.role !== 'particulier';

  if (isLoading) {
    return <Loader variant="section" />;
  }

  return (
    <Form>
      <div className="flex flex-col gap-4">
        <Notice variant="info" className="mb-4">
          <strong>Email :</strong> {profile?.email}
          <br />
          <strong>Rôle :</strong> {roles[profile?.role as keyof typeof roles]}
        </Notice>

        <Input name="first_name" label="Prénom" />
        <Input name="last_name" label="Nom de famille" />
        <PhoneInput name="phone" label="Téléphone" />

        {showStructureFields && (
          <>
            <Select
              name="structure_type"
              label="Type de structure"
              options={Object.entries(structureTypes).map(([key, label]) => ({ label, value: key }))}
            />
            <Input name="structure_name" label="Nom de la structure" />
            {structureType === 'autre' && <Input name="structure_other" label="Renseignez le type de structure" />}
          </>
        )}

        <div className="flex justify-end mt-4">
          <Submit disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Submit>
        </div>
      </div>
    </Form>
  );
}

export default ProfileForm;
