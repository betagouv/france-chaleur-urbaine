import FCUTagAutocompleteInput from '@/components/form/dsfr/FCUTagAutocompleteInput';
import useForm from '@/components/form/react-form/useForm';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import { type UsersResponse } from '@/pages/api/admin/users/[[...slug]]';
import { userRoles } from '@/types/enum/UserRole';
import cx from '@/utils/cx';
import { createUserAdminSchema, structureTypes, updateUserAdminSchema } from '@/validation/user';

export type OnCreate = (data: UsersResponse['createInput']) => Promise<void> | void;
export type OnUpdate = (data: UsersResponse['updateInput']) => Promise<void> | void;

type UserFormProps = {
  loading?: boolean;
  user?: UsersResponse['listItem'];
  onSubmit: OnCreate | OnUpdate;
};

const UserForm = ({ user, onSubmit, loading }: UserFormProps) => {
  const isNew = !user?.id;
  const { Form, Field, Submit, FieldWrapper, useValue } = useForm({
    schema: isNew ? createUserAdminSchema : updateUserAdminSchema,
    defaultValues: {
      status: user?.status || 'pending_email_confirmation',
      role: user?.role || 'gestionnaire',
      active: user?.active ?? true,
      optin_at: !!user?.optin_at,
      receive_new_demands: user?.receive_new_demands ?? true,
      receive_old_demands: user?.receive_old_demands ?? true,
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      gestionnaires: user?.gestionnaires ?? [],
      structure_name: user?.structure_name ?? '',
      structure_type: user?.structure_type ?? '',
      structure_other: user?.structure_other ?? '',
    },
    onSubmit: async ({ value }) => onSubmit(value as any),
  });

  const roleOptions = userRoles.map((role) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    value: role,
  }));

  const role = useValue('role');
  const structureType = useValue('structure_type');

  return (
    <Form>
      <div className={cx('space-y-6', loading && 'opacity-50 animate-pulse')}>
        <FieldWrapper>
          <Field.Select
            name="role"
            label="Rôle"
            options={roleOptions}
            nativeSelectProps={{
              placeholder: 'Sélectionner un rôle',
            }}
          />
        </FieldWrapper>
        <FieldWrapper>
          <Field.Checkbox
            name="active"
            label={
              <>
                Compte actif
                {!isNew && (
                  <Tag className="ml-2" variant={user?.status === 'valid' ? 'success' : 'warning'} outline size="sm">
                    {user?.status === 'valid' ? 'Validé' : 'En attente de confirmation email'}
                  </Tag>
                )}
              </>
            }
          />
          {!isNew && <Field.Checkbox name="optin_at" label={<>A accepté les conditions d'utilisation</>} />}
        </FieldWrapper>
        <FieldWrapper>
          <Field.Checkbox name="receive_new_demands" label="Reçoit les nouvelles demandes" />
          <Field.Checkbox name="receive_old_demands" label="Reçoit les anciennes demandes" />
        </FieldWrapper>
        <FieldWrapper>
          <Field.EmailInput
            name="email"
            label="Email"
            nativeInputProps={{
              placeholder: 'exemple@email.com',
            }}
          />
        </FieldWrapper>
        {role === 'gestionnaire' && (
          <FieldWrapper>
            <Field.Custom
              name="gestionnaires"
              label="Gestionnaires"
              Component={(props: any) => (
                <FCUTagAutocompleteInput undismissibles={user?.gestionnaires_from_api ?? []} multiple {...props} />
              )}
            />
          </FieldWrapper>
        )}
        {role === 'professionnel' && (
          <FieldWrapper>
            <Field.Input
              name="structure_name"
              label="Nom de la structure"
              nativeInputProps={{
                placeholder: 'Nom de la structure',
              }}
            />

            <Field.Select
              name="structure_type"
              label="Type de structure"
              options={Object.entries(structureTypes).map(([key, label]) => ({ label, value: key }))}
            />
            {structureType === 'autre' && (
              <Field.Input
                name="structure_other"
                label="Autre structure"
                className="ml-2"
                nativeInputProps={{
                  placeholder: 'Autre structure',
                }}
              />
            )}
          </FieldWrapper>
        )}

        <FieldWrapper>
          <Field.Input
            name="first_name"
            label="Prénom"
            nativeInputProps={{
              placeholder: 'Prénom',
            }}
          />
        </FieldWrapper>
        <FieldWrapper>
          <Field.Input
            name="last_name"
            label="Nom"
            nativeInputProps={{
              placeholder: 'Nom',
            }}
          />
        </FieldWrapper>
        <FieldWrapper>
          <Field.PhoneInput name="phone" label="Téléphone" />
        </FieldWrapper>

        <div className="flex justify-end">
          <Submit loading={loading}>{user ? 'Mettre à jour' : 'Créer'} l'utilisateur</Submit>
        </div>
        {!isNew && (
          <FieldWrapper>
            <label className="fr-label">
              ID
              <span className="text-gray-500 mx-2">(Lecture seule)</span>
              {user?.from_api && <Badge type="api_user" />}
            </label>
            <div className="fr-input-group">
              <input type="text" value={user?.id?.toString() || ''} disabled className="fr-input" />
            </div>
          </FieldWrapper>
        )}
      </div>
    </Form>
  );
};

export default UserForm;
