import { useStore } from '@tanstack/react-form';
import type { z } from 'zod';

import Loader from '@/components/ui/Loader';
import Notice from '@/components/ui/Notice';
import { EntrepriseField } from '@/modules/form/EntrepriseField';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import { roles, structureTypesFormLabels, updateProfileDefaultValues, zUpdateProfileSchema } from '@/modules/users/constants';
import { ObjectEntries } from '@/utils/typescript';

const structureTypeOptions = ObjectEntries(structureTypesFormLabels).map(([key, label]) => ({ label, value: key }));

/**
 * Profile edition form for the authenticated user (identity, structure, entreprise).
 */
function ProfileForm() {
  const { data: profile } = trpc.users.getProfile.useQuery();
  const utils = trpc.useUtils();

  const updateProfile = trpc.users.updateProfile.useMutation({
    onError: (error) => {
      notify('error', error.message || 'Erreur lors de la mise à jour du profil');
    },
    onSuccess: () => {
      notify('success', 'Profil mis à jour avec succès');
      utils.users.getProfile.invalidate();
    },
  });

  const defaultValues: z.input<typeof zUpdateProfileSchema> = {
    ...updateProfileDefaultValues,
    entreprise: profile?.entreprise ?? null,
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    phone: profile?.phone ?? '',
    structure_name: profile?.structure_name ?? '',
    structure_other: profile?.structure_other ?? '',
    structure_type: profile?.structure_type ?? undefined,
  };

  const form = useAppForm({
    ...schemaValidation(zUpdateProfileSchema),
    defaultValues,
    onSubmit: async ({ value }) => {
      await updateProfile.mutateAsync(value);
    },
  });

  const structureType = useStore(form.store, (state) => state.values.structure_type);
  const showStructureFields = profile?.role !== 'particulier';
  const showEntrepriseField = profile?.role !== 'particulier' && profile?.role !== 'admin';

  if (!profile) {
    return <Loader variant="section" />;
  }

  return (
    <Form form={form}>
      <div className="flex flex-col gap-4">
        <Notice variant="info" className="mb-4">
          <strong>Email :</strong> {profile.email}
          <br />
          <strong>Rôle :</strong> {roles[profile.role]}
        </Notice>

        <form.AppField name="first_name">{(field) => <field.TextField label="Prénom" />}</form.AppField>
        <form.AppField name="last_name">{(field) => <field.TextField label="Nom de famille" />}</form.AppField>
        <form.AppField name="phone">{(field) => <field.PhoneField label="Téléphone" />}</form.AppField>

        {showStructureFields && (
          <>
            <form.AppField name="structure_type">
              {(field) => <field.SelectField label="Type de structure" options={structureTypeOptions} />}
            </form.AppField>
            {structureType === 'autre' && (
              <form.AppField name="structure_other">
                {/* only rendered when "autre" is selected, where the schema refine makes it required */}
                {(field) => <field.TextField label="Renseignez le type de structure" nativeInputProps={{ required: true }} />}
              </form.AppField>
            )}
            <form.AppField name="structure_name">{(field) => <field.TextField label="Nom de la structure" />}</form.AppField>
          </>
        )}

        {showEntrepriseField && (
          <form.AppField name="entreprise">{(field) => <field.CustomField Component={EntrepriseField} label="Entreprise" />}</form.AppField>
        )}

        <div className="flex justify-end mt-4">
          <form.SubmitButton>Enregistrer les modifications</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
}

export default ProfileForm;
