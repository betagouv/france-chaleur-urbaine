import { useState } from 'react';

import Accordion from '@/components/ui/Accordion';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

import { type PermissionWithLabel, permissionBoundsKey } from '../types';
import PermissionsMap from './PermissionsMap';

/**
 * User-facing view of their permissions on the "Mon compte" page.
 * Lists access scopes as readable sentences and offers a map preview.
 * Clicking an item centers the map on that permission.
 */
const PermissionsView = () => {
  const { data: permissions, isLoading: isLoadingPermissions } = trpc.permissions.mineWithLabels.useQuery();
  const { data: mapData } = trpc.permissions.myMapData.useQuery(undefined);
  const [expanded, setExpanded] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  if (isLoadingPermissions) {
    return <Loader />;
  }

  if (!permissions || permissions.length === 0) {
    return <p className="text-sm text-faded">Aucune permission configurée pour votre compte.</p>;
  }

  const handleSelect = (p: PermissionWithLabel) => {
    if (p.type === 'national') return;
    setSelectedKey(permissionBoundsKey(p.type, p.resource_id));
    setExpanded(true);
  };

  const focusBounds = selectedKey ? mapData?.perPermissionBounds[selectedKey] : undefined;

  return (
    <div className="space-y-4">
      <PermissionsList permissions={permissions} selectedKey={selectedKey} onSelect={handleSelect} />

      <p className="text-sm text-faded">
        Ces permissions sont incorrectes ? <Link href="/contact">Contactez-nous</Link> pour demander une correction.
      </p>

      {/* `lazy`: don't mount the map while collapsed — it would init in a 0-sized hidden container
          and `fitBounds` (initial view + selection) would yield NaN. Mounts on first open, sized. */}
      <Accordion label="Voir sur la carte" simple lazy expanded={expanded} onExpandedChange={setExpanded}>
        <PermissionsMap focusBounds={focusBounds} />
      </Accordion>
    </div>
  );
};

const formatPermission = (p: PermissionWithLabel): string => {
  switch (p.type) {
    case 'commune':
      return `sur la commune de ${p.label}`;
    case 'epci':
      return `au sein de l'EPCI ${p.label}`;
    case 'ept':
      return `au sein de l'EPT ${p.label}`;
    case 'departement':
      return `dans le département ${p.label}`;
    case 'region':
      return `dans la région ${p.label}`;
    case 'national':
      return `sur l'ensemble du territoire national`;
    case 'reseau_de_chaleur':
      return `liées au réseau existant ${p.label}`;
    case 'reseau_en_construction':
      return `liées au réseau en construction ${p.label}`;
  }
};

type PermissionsListProps = {
  permissions: PermissionWithLabel[];
  selectedKey: string | null;
  onSelect: (p: PermissionWithLabel) => void;
};

const PermissionsList = ({ permissions, selectedKey, onSelect }: PermissionsListProps) => {
  return (
    <div>
      <p className="text-sm font-medium mb-1">J'ai accès aux demandes :</p>
      <ul className="list-disc list-inside text-sm space-y-1">
        {permissions.map((p) => {
          const key = permissionBoundsKey(p.type, p.resource_id);
          const isSelected = selectedKey === key;
          const isClickable = p.type !== 'national';
          return (
            <li key={key}>
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  className={cx('text-left hover:underline cursor-pointer', isSelected ? 'font-semibold text-info' : 'text-current')}
                >
                  {formatPermission(p)}
                </button>
              ) : (
                <span>{formatPermission(p)}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PermissionsView;
