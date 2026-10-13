import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import { permissionTypeBadgeColors, permissionTypeLabels } from '@/modules/permissions/constants';
import type { NetworkType } from '@/modules/reseaux/constants';
import cx from '@/utils/cx';

export type OrganizationNetworkListItem = {
  id_fcu: number;
  type: NetworkType;
  /** SNCU of a heat network: its public page is linked */
  identifiant_reseau: string | null;
  nom_reseau: string | null;
  gestionnaire: string | null;
};

type OrganizationNetworkListProps = {
  networks: OrganizationNetworkListItem[];
  /** action of each row: attach or detach */
  action: {
    label: string;
    iconId: 'ri-links-line' | 'ri-link-unlink';
    disabled: boolean;
    onClick: (network: OrganizationNetworkListItem) => void;
  };
};

/**
 * Scrollable list of networks (name, type badge, current gestionnaire) with one action button per row,
 * shared by the attached / to attach / attached out of pattern lists of the organization dialog.
 */
function OrganizationNetworkList({ networks, action }: OrganizationNetworkListProps) {
  return (
    <ul className="max-h-64 space-y-1 overflow-y-auto">
      {networks.map((network) => (
        <li
          key={`${network.type}-${network.id_fcu}`}
          className="flex items-center justify-between gap-2 rounded border border-gray-200 px-3 py-1.5"
        >
          <div className="min-w-0 text-sm">
            <div className="truncate">
              {network.identifiant_reseau ? (
                <Link href={`/reseaux/${network.identifiant_reseau}`} isExternal title="Ouvrir la fiche réseau">
                  {network.nom_reseau ?? `Réseau #${network.id_fcu}`}
                </Link>
              ) : (
                (network.nom_reseau ?? `Réseau #${network.id_fcu}`)
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-faded">
              <span className={cx('rounded px-1.5 py-0.5 font-medium', permissionTypeBadgeColors[network.type])}>
                {permissionTypeLabels[network.type]}
              </span>
              {network.gestionnaire ? <span className="truncate">· {network.gestionnaire}</span> : <span>· gestionnaire vide</span>}
            </div>
          </div>
          <Button
            type="button"
            size="small"
            priority="tertiary"
            iconId={action.iconId}
            disabled={action.disabled}
            onClick={() => action.onClick(network)}
          >
            {action.label}
          </Button>
        </li>
      ))}
    </ul>
  );
}

export default OrganizationNetworkList;
