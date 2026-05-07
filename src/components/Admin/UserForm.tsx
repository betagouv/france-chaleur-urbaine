import { useState } from 'react';

import FCUTagAutocompleteInput from '@/components/form/dsfr/FCUTagAutocompleteInput';
import useForm from '@/components/form/react-form/useForm';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { EntrepriseField } from '@/modules/form/EntrepriseField';
import PermissionsEditor from '@/modules/permissions/client/PermissionsEditor';
import PermissionsInput from '@/modules/permissions/client/PermissionsInput';
import type { Permission } from '@/modules/permissions/types';
import { permissionTypes } from '@/modules/permissions/types';
import { createUserAdminSchema, roles as roleLabels, structureTypesFormLabels, updateUserAdminSchema } from '@/modules/users/constants';
import type { User } from '@/modules/users/server/service';
import type { UsersResponse } from '@/pages/api/admin/users/[[...slug]]';
import { type UserRole, userRoles, userRolesWithPermissions } from '@/types/enum/UserRole';
import cx from '@/utils/cx';
import { ObjectEntries } from '@/utils/typescript';

export type OnCreate = (data: UsersResponse['createInput'], permissions?: Permission[]) => Promise<void> | void;
export type OnUpdate = (data: UsersResponse['updateInput']) => Promise<void> | void;

const roleOptions = userRoles.map((role) => ({
  label: roleLabels[role],
  value: role,
}));

const STRUCTURE_TYPE_TO_ROLE = {
  alec: 'alec',
  collectivite: 'collectivite',
  gestionnaire_reseaux: 'gestionnaire',
} as const satisfies Partial<Record<keyof typeof structureTypesFormLabels, UserRole>>;

const getAvailableTypes = (role: UserRole) => {
  if ((userRolesWithPermissions as readonly string[]).includes(role)) return permissionTypes;
  return [] as const;
};

type UserFormProps = {
  loading?: boolean;
  user?: User;
  onSubmit: OnCreate | OnUpdate;
};

const UserForm = ({ user, onSubmit, loading }: UserFormProps) => {
  const isNew = !user?.id;
  const [newPermissions, setNewPermissions] = useState<Permission[]>([]);

  const { Form, Field, Submit, FieldWrapper, useValue, form } = useForm({
    defaultValues: {
      active: user?.active ?? true,
      email: user?.email ?? '',
      entreprise: user?.entreprise ?? null,
      first_name: user?.first_name ?? '',
      gestionnaires: user?.gestionnaires ?? [],
      last_name: user?.last_name ?? '',
      optin_at: !!user?.optin_at,
      phone: user?.phone ?? '',
      receive_new_demands: user?.receive_new_demands ?? true,
      receive_old_demands: user?.receive_old_demands ?? true,
      role: user?.role || 'gestionnaire',
      status: user?.status || 'pending_email_confirmation',
      structure_name: user?.structure_name ?? '',
      structure_other: user?.structure_other ?? '',
      structure_type: user?.structure_type ?? '',
    },
    onSubmit: async ({ value }) => {
      if (isNew) {
        await (onSubmit as OnCreate)(value as any, newPermissions.length > 0 ? newPermissions : undefined);
      } else {
        await (onSubmit as OnUpdate)(value as any);
      }
    },
    schema: isNew ? createUserAdminSchema : updateUserAdminSchema,
  });

  const role = useValue<UserRole>('role');
  const structureType = useValue('structure_type');
  const showPermissions = (userRolesWithPermissions as readonly string[]).includes(role);
  const showStructureFields = role === 'professionnel' || role === 'gestionnaire' || role === 'collectivite' || role === 'alec';

  return (
    <Form>
      <div className={cx('space-y-6', loading && 'opacity-50 animate-pulse')}>
        {/* Identité */}
        <FieldWrapper>
          <Field.EmailInput
            name="email"
            label="Email"
            hideOptionalLabel
            nativeInputProps={{
              placeholder: 'exemple@email.com',
            }}
          />
        </FieldWrapper>

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

        {/* Structure */}
        {showStructureFields && (
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
              options={ObjectEntries(structureTypesFormLabels).map(([key, label]) => ({ label, value: key }))}
              nativeSelectProps={{
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value;
                  form.setFieldValue('structure_type', value);
                  const mappedRole = STRUCTURE_TYPE_TO_ROLE[value as keyof typeof STRUCTURE_TYPE_TO_ROLE];
                  if (mappedRole) form.setFieldValue('role', mappedRole);
                },
              }}
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

            <Field.Custom name="entreprise" label="Entreprise" Component={EntrepriseField} />
          </FieldWrapper>
        )}

        {/* Compte */}
        <FieldWrapper>
          <Field.Checkbox
            name="active"
            label={
              <>
                Compte activé
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

        {/* Rôle, permissions et notifications */}
        <div className="border border-blue-300 rounded-lg p-4 space-y-4 bg-blue-50/30">
          <h4 className="text-base font-bold m-0">Rôle et accès</h4>

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

          {showPermissions && (
            <FieldWrapper>
              {isNew ? (
                <div className="space-y-3">
                  <label className="fr-label">Permissions</label>
                  <PermissionsInput value={newPermissions} onChange={setNewPermissions} availableTypes={getAvailableTypes(role)} />
                </div>
              ) : (
                <PermissionsEditor userId={user!.id} />
              )}
            </FieldWrapper>
          )}

          <FieldWrapper>
            Notifications email :
            <Field.Checkbox
              name="receive_new_demands"
              label={
                <>
                  Nouvelles demandes
                  <Tooltip
                    title="Notifications quotidiennes pour les nouvelles demandes déposées sur France Chaleur Urbaine"
                    iconProps={{ className: 'ml-1 mb-2' }}
                  />
                </>
              }
            />
            <Field.Checkbox
              name="receive_old_demands"
              label={
                <>
                  Demandes en attente de prise en charge
                  <Tooltip
                    title="Notifications hebdomadaires si des demandes sont en attente de prise en charge depuis plus de 7 jours"
                    iconProps={{ className: 'ml-1 mb-2' }}
                  />
                </>
              }
            />
          </FieldWrapper>

          {/* Tags gestionnaire (ancien système) */}
          {role === 'gestionnaire' && !isNew && (
            <FieldWrapper>
              <Field.Custom
                name="gestionnaires"
                label="Tags gestionnaires (obsolète)"
                Component={(props: any) => (
                  <FCUTagAutocompleteInput undismissibles={user?.gestionnaires_from_api ?? []} multiple disabled {...props} />
                )}
              />
            </FieldWrapper>
          )}
        </div>

        <div className="flex justify-end">
          <Submit loading={loading}>{isNew ? 'Créer' : 'Mettre à jour'} l'utilisateur</Submit>
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
