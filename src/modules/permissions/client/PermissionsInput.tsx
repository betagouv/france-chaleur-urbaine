import Tag from '@codegouvfr/react-dsfr/Tag';
import { useState } from 'react';

import Button from '@/components/ui/Button';
import trpc from '@/modules/trpc/client';

import { permissionTypeLabels } from '../constants';
import type { Permission, PermissionType } from '../types';
import BulkAddNetworksDialog from './BulkAddNetworksDialog';
import PermissionAutocomplete from './PermissionAutocomplete';

type PermissionsInputProps = {
  availableTypes: readonly PermissionType[];
  onChange: (permissions: Permission[]) => void;
  value: Permission[];
};

/**
 * Controlled permissions editor with autocomplete search and DSFR dismissible tags.
 * No tRPC mutations — used for impersonation and user creation.
 */
const PermissionsInput = ({ value, onChange, availableTypes }: PermissionsInputProps) => {
  const [bulkOpen, setBulkOpen] = useState(false);
  const supportsNetworks = availableTypes.includes('reseau_de_chaleur');

  const resolvedLabels = trpc.permissions.resolveLabels.useQuery(value, {
    enabled: value.length > 0,
  });

  const labelMap = new Map(resolvedLabels.data?.map((r) => [`${r.type}:${r.resource_id}`, r.label]) ?? []);

  const handleAdd = (permission: Permission) => {
    const exists = value.some((p) => p.type === permission.type && p.resource_id === permission.resource_id);
    if (!exists) {
      onChange([...value, permission]);
    }
  };

  const handleBulkAdd = (permissions: Permission[]) => {
    const existingKeys = new Set(value.map((p) => `${p.type}:${p.resource_id}`));
    const toAdd = permissions.filter((p) => !existingKeys.has(`${p.type}:${p.resource_id}`));
    if (toAdd.length > 0) onChange([...value, ...toAdd]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const getLabel = (p: Permission) => {
    const resolved = labelMap.get(`${p.type}:${p.resource_id}`);
    if (resolved) return resolved;
    if (p.type === 'national') return 'National';
    return p.resource_id ?? '';
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((p, i) => (
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
              {permissionTypeLabels[p.type]} : {getLabel(p)}
            </Tag>
          ))}
        </div>
      )}

      <PermissionAutocomplete availableTypes={availableTypes} onAdd={handleAdd} />

      {supportsNetworks && (
        <>
          <div className="flex justify-end">
            <Button type="button" priority="tertiary" size="small" iconId="fr-icon-add-line" onClick={() => setBulkOpen(true)}>
              Ajout en masse par ID SNCU
            </Button>
          </div>
          <BulkAddNetworksDialog open={bulkOpen} onOpenChange={setBulkOpen} existingPermissions={value} onAdd={handleBulkAdd} />
        </>
      )}
    </div>
  );
};

export default PermissionsInput;
