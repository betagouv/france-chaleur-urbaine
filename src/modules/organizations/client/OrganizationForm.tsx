import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { zCreateOrganization } from '@/modules/organizations/constants';
import type { Organization } from '@/modules/organizations/types';

type OrganizationFormProps = {
  organization?: Pick<Organization, 'id' | 'name'>;
  loading?: boolean;
  onSubmit: (data: { name: string }) => Promise<void> | void;
};

const OrganizationForm = ({ organization, onSubmit, loading }: OrganizationFormProps) => {
  const isNew = !organization?.id;

  const form = useAppForm({
    ...schemaValidation(zCreateOrganization),
    defaultValues: {
      name: organization?.name ?? '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit({ name: value.name });
    },
  });

  return (
    <Form form={form}>
      <div className="space-y-6">
        <form.AppField name="name">
          {(field) => <field.TextField label="Nom de l'organisation" nativeInputProps={{ placeholder: 'ENGIE, Dalkia, régie…' }} />}
        </form.AppField>
        <div className="flex justify-end">
          <form.SubmitButton loading={loading}>{isNew ? "Créer l'organisation" : 'Enregistrer'}</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
};

export default OrganizationForm;
