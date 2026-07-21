import { useStore } from '@tanstack/react-form';
import { useState } from 'react';
import type { z } from 'zod';

import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { EntrepriseField } from '@/modules/form/EntrepriseField';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import PermissionsEditor from '@/modules/permissions/client/PermissionsEditor';
import PermissionsInput from '@/modules/permissions/client/PermissionsInput';
import type { Permission } from '@/modules/permissions/types';
import { permissionTypes } from '@/modules/permissions/types';
import TagsCombobox from '@/modules/users/client/admin/TagsCombobox';
import TagsEditor from '@/modules/users/client/admin/TagsEditor';
import { createUserAdminSchema, roles as roleLabels, structureTypesFormLabels, updateUserAdminSchema } from '@/modules/users/constants';
import type { User } from '@/modules/users/server/service';
import type { UsersResponse } from '@/pages/api/admin/users/[[...slug]]';
import { type UserRole, userRoles, userRolesWithPermissions } from '@/types/enum/UserRole';
import cx from '@/utils/cx';
import { ObjectEntries } from '@/utils/typescript';

export type OnCreate = (data: UsersResponse['createInput'], permissions?: Permission[], tagIds?: string[]) => Promise<void> | void;
export type OnUpdate = (data: UsersResponse['updateInput']) => Promise<void> | void;

// create + update inputs merged; the runtime values always hold the full superset
type UserFormValues = z.input<typeof createUserAdminSchema> & Partial<z.input<typeof updateUserAdminSchema>>;

const roleOptions = userRoles.map((role) => ({
  label: roleLabels[role],
  value: role,
}));

const structureTypeOptions = ObjectEntries(structureTypesFormLabels).map(([key, label]) => ({ label, value: key }));

const STRUCTURE_TYPE_TO_ROLE = {
  alec: 'alec',
  ccrt: 'ccrt',
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

/**
 * Admin user create/update form: identity, structure, account state, role,
 * permissions, email notifications and tags.
 */
const UserForm = ({ user, onSubmit, loading }: UserFormProps) => {
  const isNew = !user?.id;
  const [newPermissions, setNewPermissions] = useState<Permission[]>([]);
  const [newTagIds, setNewTagIds] = useState<string[]>([]);

  const defaultValues: UserFormValues = {
    active: user?.active ?? true,
    email: user?.email ?? '',
    entreprise: user?.entreprise ?? null,
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    optin_at: !!user?.optin_at,
    phone: user?.phone ?? '',
    receive_new_demands: user?.receive_new_demands ?? true,
    receive_old_demands: user?.receive_old_demands ?? true,
    role: user?.role || 'gestionnaire',
    status: user?.status || 'pending_email_confirmation',
    structure_name: user?.structure_name ?? '',
    structure_other: user?.structure_other ?? '',
    structure_type: user?.structure_type ?? null,
  };

  // both mode schemas validate the same runtime values; unify their type for TanStack
  const schema = (isNew ? createUserAdminSchema : updateUserAdminSchema) as unknown as z.ZodType<UserFormValues, UserFormValues>;

  const form = useAppForm({
    ...schemaValidation(schema),
    defaultValues,
    onSubmit: async ({ value }) => {
      if (isNew) {
        await (onSubmit as OnCreate)(
          value as UsersResponse['createInput'],
          newPermissions.length > 0 ? newPermissions : undefined,
          newTagIds.length > 0 ? newTagIds : undefined
        );
      } else {
        await (onSubmit as OnUpdate)(value as UsersResponse['updateInput']);
      }
    },
  });

  const role = useStore(form.store, (state) => state.values.role);
  const structureType = useStore(form.store, (state) => state.values.structure_type);
  const showPermissions = (userRolesWithPermissions as readonly string[]).includes(role);
  const showStructureFields =
    role === 'professionnel' || role === 'gestionnaire' || role === 'collectivite' || role === 'alec' || role === 'ccrt';

  return (
    <Form form={form}>
      <div className={cx('space-y-6', loading && 'opacity-50 animate-pulse')}>
        {/* Identité */}
        <form.AppField name="email">
          {(field) => (
            <field.EmailField
              label="Email"
              hideOptionalLabel
              nativeInputProps={{
                placeholder: 'exemple@email.com',
              }}
            />
          )}
        </form.AppField>
        <form.AppField name="first_name">
          {(field) => (
            <field.TextField
              label="Prénom"
              nativeInputProps={{
                placeholder: 'Prénom',
              }}
            />
          )}
        </form.AppField>
        <form.AppField name="last_name">
          {(field) => (
            <field.TextField
              label="Nom"
              nativeInputProps={{
                placeholder: 'Nom',
              }}
            />
          )}
        </form.AppField>
        <form.AppField name="phone">{(field) => <field.PhoneField label="Téléphone" />}</form.AppField>

        {/* Structure */}
        {showStructureFields && (
          <div>
            <form.AppField name="structure_name">
              {(field) => (
                <field.TextField
                  label="Nom de la structure"
                  nativeInputProps={{
                    placeholder: 'Nom de la structure',
                  }}
                />
              )}
            </form.AppField>

            <form.AppField
              name="structure_type"
              listeners={{
                onChange: ({ value }) => {
                  const mappedRole = STRUCTURE_TYPE_TO_ROLE[value as keyof typeof STRUCTURE_TYPE_TO_ROLE];
                  if (mappedRole) {
                    form.setFieldValue('role', mappedRole);
                  }
                },
              }}
            >
              {(field) => <field.SelectField label="Type de structure" options={structureTypeOptions} />}
            </form.AppField>
            {structureType === 'autre' && (
              <form.AppField name="structure_other">
                {/* only rendered when "autre" is selected, where it is expected to be filled */}
                {(field) => (
                  <field.TextField
                    label="Autre structure"
                    className="ml-2"
                    nativeInputProps={{
                      placeholder: 'Autre structure',
                      required: true,
                    }}
                  />
                )}
              </form.AppField>
            )}

            <form.AppField name="entreprise">
              {(field) => <field.CustomField Component={EntrepriseField} label="Entreprise" />}
            </form.AppField>
          </div>
        )}

        {/* Compte */}
        <div>
          <form.AppField name="active">
            {(field) => (
              <field.CheckboxField
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
            )}
          </form.AppField>
          {!isNew && (
            <form.AppField name="optin_at">
              {(field) => <field.CheckboxField label={<>A accepté les conditions d'utilisation</>} />}
            </form.AppField>
          )}
        </div>

        {/* Rôle, permissions et notifications */}
        <div className="border border-blue-300 rounded-lg p-4 space-y-4 bg-blue-50/30">
          <h4 className="text-base font-bold m-0">Rôle et accès</h4>

          <form.AppField name="role">
            {(field) => <field.SelectField label="Rôle" options={roleOptions} placeholder="Sélectionner un rôle" />}
          </form.AppField>

          {showPermissions &&
            (isNew ? (
              <div className="space-y-3">
                <label className="fr-label">Permissions</label>
                <PermissionsInput value={newPermissions} onChange={setNewPermissions} availableTypes={getAvailableTypes(role)} />
              </div>
            ) : (
              <PermissionsEditor userId={user!.id} />
            ))}

          <div>
            Notifications email (si permission réseau) :
            <form.AppField name="receive_new_demands">
              {(field) => (
                <field.CheckboxField
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
              )}
            </form.AppField>
            <form.AppField name="receive_old_demands">
              {(field) => (
                <field.CheckboxField
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
              )}
            </form.AppField>
          </div>
        </div>

        {/* Étiquettes (métadonnées transverses, tous rôles) */}
        <div className="fr-input-group">
          <label className="fr-label">Étiquettes</label>
          {isNew ? <TagsCombobox value={newTagIds} onChange={setNewTagIds} /> : <TagsEditor userId={user!.id} />}
        </div>

        <div className="flex justify-end">
          <form.SubmitButton loading={loading}>{isNew ? 'Créer' : 'Mettre à jour'} l'utilisateur</form.SubmitButton>
        </div>
        {!isNew && (
          <div>
            <label className="fr-label">
              ID
              <span className="text-gray-500 mx-2">(Lecture seule)</span>
              {user?.from_organization_id && <Badge type="api_user" />}
            </label>
            <div className="fr-input-group">
              <input type="text" value={user?.id?.toString() || ''} disabled className="fr-input" />
            </div>
          </div>
        )}
      </div>
    </Form>
  );
};

export default UserForm;
