import Tag from '@codegouvfr/react-dsfr/Tag';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import Button from '@/components/ui/Button';
import trpc from '@/modules/trpc/client';

import { permissionTypeLabels } from '../constants';
import type { Permission } from '../types';
import { permissionTypes } from '../types';
import BulkAddNetworksDialog from './BulkAddNetworksDialog';
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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
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

  const handleBulkAdd = (newPerms: Permission[]) => {
    const current = permissions ?? [];
    const existingKeys = new Set(current.map((p) => `${p.type}:${p.resource_id}`));
    const toAdd = newPerms.filter((p) => !existingKeys.has(`${p.type}:${p.resource_id}`));
    if (toAdd.length > 0) {
      setPermissions.mutate({ permissions: [...current, ...toAdd], userId });
    }
  };

  const handleRemove = (index: number) => {
    const updated = (permissions ?? []).filter((_, i) => i !== index);
    setPermissions.mutate({ permissions: updated, userId });
  };

  const handleClearAll = () => {
    setPermissions.mutate({ permissions: [], userId });
    setConfirmingClear(false);
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
                type: 'button',
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

      <div className="flex items-center justify-between gap-2">
        {permissions && permissions.length > 0 ? (
          confirmingClear ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">Supprimer les {permissions.length} permissions ?</span>
              <Button type="button" priority="tertiary" size="small" onClick={handleClearAll}>
                Confirmer
              </Button>
              <Button type="button" priority="tertiary" size="small" onClick={() => setConfirmingClear(false)}>
                Annuler
              </Button>
            </div>
          ) : (
            <Button type="button" priority="tertiary" size="small" iconId="fr-icon-delete-line" onClick={() => setConfirmingClear(true)}>
              Tout supprimer
            </Button>
          )
        ) : (
          <span />
        )}
        <Button type="button" priority="tertiary" size="small" iconId="fr-icon-add-line" onClick={() => setBulkOpen(true)}>
          Ajout en masse par ID SNCU
        </Button>
      </div>

      <BulkAddNetworksDialog open={bulkOpen} onOpenChange={setBulkOpen} existingPermissions={permissions ?? []} onAdd={handleBulkAdd} />

      {setPermissions.isPending && <p className="text-sm text-faded">Enregistrement...</p>}
    </div>
  );
};

export default PermissionsEditor;
