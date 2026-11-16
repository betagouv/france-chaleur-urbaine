import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import Dialog from '@/components/ui/Dialog';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import { useAuthentication } from '@/modules/auth/client/hooks';
import trpc from '@/modules/trpc/client';
import { userRolesWithPermissions } from '@/types/enum/UserRole';

import type { AccessDetailUser } from '../types';
import { formatLastConnection } from './access-user-formatting';

type AccessDetailDialogProps = {
  demandId: string;
  users?: AccessDetailUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Dialog listant les utilisateurs ayant (ou qui auront) accès à une demande, groupés par rôle.
 * La requête est désactivée lorsque les comptes CCRT sont déjà fournis par la liste admin.
 */
export default function AccessDetailDialog({ demandId, users: suppliedUsers, open, onOpenChange }: AccessDetailDialogProps) {
  const { hasRole } = useAuthentication();
  const isAdmin = hasRole('admin');
  const query = trpc.permissions.listUsersWithAccessToDemand.useQuery(
    { demandId },
    { enabled: open && suppliedUsers === undefined, staleTime: 60_000 }
  );

  const users: AccessDetailUser[] | undefined = suppliedUsers ?? query.data;
  const isLoading = suppliedUsers === undefined && query.isLoading;
  const grouped = userRolesWithPermissions.map((role) => ({
    role,
    users: (users ?? []).filter((user) => user.role === role),
  }));

  return (
    <Dialog title="Utilisateurs avec accès à la demande" size="lg" open={open} onOpenChange={onOpenChange}>
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader size="md" />
        </div>
      )}

      {!isLoading && users && users.length === 0 && <div className="text-gray-600 italic">Personne n'a accès à cette demande.</div>}

      {!isLoading && users && users.length > 0 && (
        <div className="flex flex-col gap-4">
          {grouped.map(({ role, users: roleUsers }) => {
            if (roleUsers.length === 0) return null;
            return (
              <div key={role} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <UserRoleBadge role={role} />
                  <span className="text-sm text-gray-600">
                    {roleUsers.length} utilisateur{roleUsers.length > 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="flex flex-col gap-1 list-disc pl-6">
                  {roleUsers.map((user) => (
                    <li key={user.id} className="text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 lg:flex-nowrap">
                        <span className="min-w-0 break-words">
                          <a className="break-all" href={`mailto:${user.email}`}>
                            {user.email}
                          </a>
                          {user.last_connection !== undefined && <> · {formatLastConnection(user.last_connection)}</>}
                        </span>
                        {isAdmin && (
                          <Link
                            href={`/admin/events?authorIds=${user.id}&preset=6m`}
                            variant="tertiaryNoOutline"
                            title="Voir l'historique des événements de cet utilisateur"
                            className="fr-btn--sm fr-btn--icon-left fr-icon-time-line shrink-0"
                          >
                            Voir l'activité
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}
