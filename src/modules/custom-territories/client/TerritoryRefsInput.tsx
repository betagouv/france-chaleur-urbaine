import Tag from '@codegouvfr/react-dsfr/Tag';

import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import PermissionAutocomplete from '@/modules/permissions/client/PermissionAutocomplete';
import { permissionTypeLabels } from '@/modules/permissions/constants';
import { territoryPermissionResourceTypes } from '@/modules/permissions/types';
import trpc from '@/modules/trpc/client';

import { type TerritoryRef, zTerritoryRef } from '../constants';

type TerritoryRefsInputProps = {
  label: React.ReactNode;
  hintText?: React.ReactNode;
  state?: 'error' | 'default';
  stateRelatedMessage?: React.ReactNode;
  value: TerritoryRef[];
  onChange: (value: TerritoryRef[]) => void;
};

const refKey = (ref: TerritoryRef) => `${ref.type}:${ref.code}`;

/**
 * Controlled list of administrative territories (commune, EPCI, EPT, département, région) picked through
 * the permissions autocomplete and displayed as dismissible tags. Compatible with the `CustomField` bridge.
 */
function TerritoryRefsInput({ label, hintText, state, stateRelatedMessage, value, onChange }: TerritoryRefsInputProps) {
  const labels = trpc.permissions.resolveLabels.useQuery(
    value.map((ref) => ({ resource_id: ref.code, type: ref.type })),
    { enabled: value.length > 0 }
  );
  const labelByKey = new Map(labels.data?.map((permission) => [`${permission.type}:${permission.resource_id}`, permission.label]) ?? []);

  const handleAdd = (permission: { resource_id: string; type: string }) => {
    const parsed = zTerritoryRef.safeParse({ code: permission.resource_id, type: permission.type });
    if (!parsed.success || value.some((ref) => refKey(ref) === refKey(parsed.data))) {
      return;
    }
    onChange([...value, parsed.data]);
  };

  return (
    <FieldWrapper label={label} hintText={hintText} state={state} stateRelatedMessage={stateRelatedMessage}>
      <div className="space-y-3">
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((ref) => (
              <Tag
                key={refKey(ref)}
                dismissible
                small
                nativeButtonProps={{
                  onClick: () => onChange(value.filter((other) => refKey(other) !== refKey(ref))),
                  title: 'Retirer',
                  type: 'button',
                }}
              >
                {permissionTypeLabels[ref.type]} : {labelByKey.get(refKey(ref)) ?? ref.code}
              </Tag>
            ))}
          </div>
        )}
        <PermissionAutocomplete availableTypes={territoryPermissionResourceTypes} onAdd={handleAdd} />
      </div>
    </FieldWrapper>
  );
}

export default TerritoryRefsInput;
