import Tag from '@codegouvfr/react-dsfr/Tag';

import trpc from '@/modules/trpc/client';

import { permissionTypeLabels } from '../constants';
import type { Permission, PermissionType } from '../types';
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
  const resolvedLabels = trpc.permissions.resolveLabels.useQuery(value, {
    enabled: value.length > 0,
  });

  const labelMap = new Map(resolvedLabels.data?.map((r) => [`${r.type}:${r.resourceId}`, r.label]) ?? []);

  const handleAdd = (permission: Permission) => {
    const exists = value.some((p) => p.type === permission.type && p.resourceId === permission.resourceId);
    if (!exists) {
      onChange([...value, permission]);
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const getLabel = (p: Permission) => {
    const resolved = labelMap.get(`${p.type}:${p.resourceId}`);
    if (resolved) return resolved;
    if (p.type === 'national') return 'National';
    return p.resourceId ?? '';
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((p, i) => (
            <Tag
              key={`${p.type}-${p.resourceId}`}
              dismissible
              small
              nativeButtonProps={{
                onClick: () => handleRemove(i),
                title: 'Supprimer',
              }}
            >
              {permissionTypeLabels[p.type]} : {getLabel(p)}
            </Tag>
          ))}
        </div>
      )}

      <PermissionAutocomplete availableTypes={availableTypes} onAdd={handleAdd} />
    </div>
  );
};

export default PermissionsInput;
