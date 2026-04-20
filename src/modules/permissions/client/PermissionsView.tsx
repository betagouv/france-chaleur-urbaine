import Accordion from '@/components/ui/Accordion';
import Loader from '@/components/ui/Loader';
import trpc from '@/modules/trpc/client';

import type { PermissionWithLabel } from '../types';
import PermissionsMap from './PermissionsMap';

/**
 * User-facing view of their permissions on the "Mon compte" page.
 * Lists access scopes as readable sentences and offers a map preview.
 */
const PermissionsView = () => {
  const { data: permissions, isLoading: isLoadingPermissions } = trpc.permissions.mineWithLabels.useQuery();

  if (isLoadingPermissions) {
    return <Loader />;
  }

  if (!permissions || permissions.length === 0) {
    return <p className="text-sm text-faded">Aucune permission configurée pour votre compte.</p>;
  }

  return (
    <div className="space-y-4">
      <PermissionsList permissions={permissions} />

      <Accordion label="Voir sur la carte" simple lazy>
        <PermissionsMap />
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
    case 'reseau_existant':
      return `liées au réseau existant ${p.label}`;
    case 'reseau_en_construction':
      return `liées au réseau en construction ${p.label}`;
  }
};

const PermissionsList = ({ permissions }: { permissions: PermissionWithLabel[] }) => {
  return (
    <div>
      <p className="text-sm font-medium mb-1">J'ai accès aux demandes :</p>
      <ul className="list-disc list-inside text-sm space-y-1">
        {permissions.map((p) => (
          <li key={`${p.type}-${p.resourceId}`}>{formatPermission(p)}</li>
        ))}
      </ul>
    </div>
  );
};

export default PermissionsView;
