import Tag from '@codegouvfr/react-dsfr/Tag';
import { useQueryClient } from '@tanstack/react-query';

import trpc from '@/modules/trpc/client';

import { permissionTypeLabels } from '../constants';
import type { Permission } from '../types';
import { permissionTypes } from '../types';
import PermissionAutocomplete from './PermissionAutocomplete';

type PermissionsEditorProps = {
  userId: string;
};

/**
 * tRPC-connected permissions editor for user edit mode.
 * Loads and saves permissions via admin endpoints.
 * getForUser returns permissions with labels in a single call.
 */
const PermissionsEditor = ({ userId }: PermissionsEditorProps) => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const { data: permissions } = trpc.permissions.admin.getForUser.useQuery({ userId });

  const setPermissions = trpc.permissions.admin.setForUser.useMutation({
    onSuccess: () => {
      void utils.permissions.admin.getForUser.invalidate({ userId });
      void queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  const handleAdd = (permission: Permission) => {
    const current = permissions ?? [];
    const exists = current.some((p) => p.type === permission.type && p.resource_id === permission.resource_id);
    if (!exists) {
      setPermissions.mutate({ permissions: [...current, permission], userId });
    }
  };

  const handleRemove = (index: number) => {
    const updated = (permissions ?? []).filter((_, i) => i !== index);
    setPermissions.mutate({ permissions: updated, userId });
  };

  return (
    <div className="space-y-3">
      <label className="fr-label">Permissions</label>

      {permissions && permissions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {permissions.map((p, i) => (
            <Tag
              key={`${p.type}-${p.resource_id}`}
              dismissible
              small
              nativeButtonProps={{
                onClick: () => handleRemove(i),
                title: 'Supprimer',
              }}
            >
              {permissionTypeLabels[p.type]} : {p.label}
            </Tag>
          ))}
        </div>
      ) : (
        <p className="text-sm text-faded">Aucune permission configurée</p>
      )}

      <PermissionAutocomplete availableTypes={permissionTypes} onAdd={handleAdd} />

      {setPermissions.isPending && <p className="text-sm text-faded">Enregistrement...</p>}
    </div>
  );
};

export default PermissionsEditor;
