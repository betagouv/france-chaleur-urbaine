import { Button } from '@codegouvfr/react-dsfr/Button';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { useState } from 'react';

import PermissionsInput from '@/modules/permissions/client/PermissionsInput';
import type { Permission } from '@/modules/permissions/types';
import { permissionTypes } from '@/modules/permissions/types';
import type { UserRole } from '@/types/enum/UserRole';
import { userRolesWithPermissions } from '@/types/enum/UserRole';
import { postFetchJSON } from '@/utils/network';

const roles = [
  { label: 'Gestionnaire', value: 'gestionnaire' },
  { label: 'Collectivité', value: 'collectivite' },
  { label: 'ALEC', value: 'alec' },
  { label: 'CCRT', value: 'ccrt' },
  { label: 'Professionnel', value: 'professionnel' },
  { label: 'Particulier', value: 'particulier' },
] satisfies { label: string; value: UserRole }[];

type ImpersonateUserRole = (typeof roles)[number]['value'];

const roleNeedsPermissions = (role: ImpersonateUserRole): boolean => {
  return (userRolesWithPermissions as readonly string[]).includes(role);
};

const UserImpersonation = () => {
  const [selectedRole, setSelectedRole] = useState<ImpersonateUserRole>('gestionnaire');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [anonymize, setAnonymize] = useState(false);

  async function startImpersonation() {
    try {
      await postFetchJSON('/api/admin/impersonate', {
        role: selectedRole,
        ...(roleNeedsPermissions(selectedRole) && permissions.length > 0 ? { permissions } : {}),
        ...(anonymize ? { anonymize: true } : {}),
      });
      // trigger a full reload to update the session
      location.href = '/pro/tableau-de-bord';
    } catch (err) {
      console.error('err', err);
    }
  }

  const handleRoleChange = (role: ImpersonateUserRole) => {
    setSelectedRole(role);
    setPermissions([]);
  };

  return (
    <>
      <div className="mb-2w">Cette section permet de vous faire passer pour un autre profil à des fins de test.</div>

      <Select
        label="Rôle"
        className="fr-col-xl-4 fr-col-md-6 fr-mb-2w"
        nativeSelectProps={{
          onChange: (e) => handleRoleChange(e.target.value as ImpersonateUserRole),
          value: selectedRole,
        }}
        options={roles}
      />

      {roleNeedsPermissions(selectedRole) && (
        <div className="fr-col-xl-6 fr-col-md-8 fr-mb-2w">
          <label className="fr-label">Permissions simulées</label>
          <PermissionsInput value={permissions} onChange={setPermissions} availableTypes={permissionTypes} />
        </div>
      )}

      <Checkbox
        options={[
          {
            hintText: 'Utile pour les démonstrations.',
            label: 'Anonymiser les données personnelles (nom, email, téléphone)',
            nativeInputProps: {
              checked: anonymize,
              onChange: (e) => setAnonymize(e.target.checked),
            },
          },
        ]}
      />

      <Button className="fr-mt-2w" onClick={() => startImpersonation()}>
        Lancer l'imposture
      </Button>
    </>
  );
};

export default UserImpersonation;
