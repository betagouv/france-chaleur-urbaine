import { Badge } from '@codegouvfr/react-dsfr/Badge';

import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Tooltip from '@/components/ui/Tooltip';
import { NetworkUsersCell } from '@/modules/demands/client/NetworkUsersCell';

import type { NetworkTrackingDetail } from './types';
import { useNetworkTrackingRefresh } from './useNetworkTrackingRefresh';

const ORGANIZATIONS_URL = '/admin/organizations';

type OrganizationBadgeProps = {
  name: string;
};

/**
 * Name of the organization a network belongs to, in the tracking table.
 */
export function OrganizationBadge({ name }: OrganizationBadgeProps) {
  return (
    <Tooltip title="Organisation à laquelle le réseau est rattachée : ses comptes ont accès aux demandes du réseau sans en être prévenus.">
      <span className="inline-flex cursor-help items-center text-xs text-(--text-mention-grey)">
        <Icon name="fr-icon-building-line" size="xs" className="mr-1" />
        {name}
      </span>
    </Tooltip>
  );
}

type NetworkTrackingOrganizationProps = {
  organization: NonNullable<NetworkTrackingDetail['organization']>;
};

/**
 * Organization of a tracked network: its name, whether it can update the demands through the partner API, and its accounts.
 * Its accounts can process the demands of the network but are neither notified nor reminded: no button copying their addresses.
 */
export function NetworkTrackingOrganization({ organization }: NetworkTrackingOrganizationProps) {
  const refresh = useNetworkTrackingRefresh();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link href={ORGANIZATIONS_URL} className="text-sm font-semibold">
          {organization.name}
        </Link>
        {organization.hasApiAccess ? (
          <Tooltip title="L'organisation a un jeton d'API partenaire non révoqué : elle peut mettre à jour les demandes de ses réseaux par l'API.">
            <Badge small severity="success" className="cursor-help whitespace-nowrap">
              Accès API actif
            </Badge>
          </Tooltip>
        ) : (
          <Badge small className="whitespace-nowrap">
            Aucun accès API
          </Badge>
        )}
      </div>
      <NetworkUsersCell users={organization.users} emptyLabel="Aucun compte" onEmailUnblocked={refresh} />
    </div>
  );
}
