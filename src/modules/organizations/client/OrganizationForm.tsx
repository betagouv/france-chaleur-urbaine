import useForm from '@/components/form/react-form/useForm';
import { zCreateOrganization } from '@/modules/organizations/constants';
import type { Organization } from '@/modules/organizations/types';

type OrganizationFormProps = {
  organization?: Pick<Organization, 'id' | 'name'>;
  loading?: boolean;
  onSubmit: (data: { name: string }) => Promise<void> | void;
};

const OrganizationForm = ({ organization, onSubmit, loading }: OrganizationFormProps) => {
  const isNew = !organization?.id;

  const { Form, Field, Submit, FieldWrapper } = useForm({
    defaultValues: {
      name: organization?.name ?? '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit({ name: value.name });
    },
    schema: zCreateOrganization,
  });

  return (
    <Form>
      <div className="space-y-6">
        <FieldWrapper>
          <Field.Input name="name" label="Nom de l'organisation" nativeInputProps={{ placeholder: 'ENGIE, Dalkia, régie…' }} />
        </FieldWrapper>
        <div className="flex justify-end">
          <Submit loading={loading}>{isNew ? "Créer l'organisation" : 'Enregistrer'}</Submit>
        </div>
      </div>
    </Form>
  );
};

export default OrganizationForm;
