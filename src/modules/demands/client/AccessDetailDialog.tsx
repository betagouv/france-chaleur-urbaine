import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import Dialog from '@/components/ui/Dialog';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import { useAuthentication } from '@/modules/auth/client/hooks';
import trpc from '@/modules/trpc/client';
import type { UserRole } from '@/types/enum/UserRole';

type AccessDetailDialogProps = {
  demandId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const roleOrder: readonly UserRole[] = ['gestionnaire', 'collectivite', 'alec'] as const;

/**
 * Dialog listant les utilisateurs ayant (ou qui auront) accès à une demande, groupés par rôle.
 * Query tRPC déclenchée uniquement à l'ouverture (`enabled: open`), cachée 60s par React Query.
 */
export default function AccessDetailDialog({ demandId, open, onOpenChange }: AccessDetailDialogProps) {
  const { hasRole } = useAuthentication();
  const isAdmin = hasRole('admin');
  const { data: users, isLoading } = trpc.permissions.listUsersWithAccessToDemand.useQuery(
    { demandId },
    { enabled: open, staleTime: 60_000 }
  );

  const grouped = roleOrder.map((role) => ({
    role,
    users: (users ?? []).filter((u) => u.role === role),
  }));

  return (
    <Dialog title="Utilisateurs avec accès à la demande" size="md" open={open} onOpenChange={onOpenChange}>
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
                  {roleUsers.map((u) => (
                    <li key={u.id} className="text-sm">
                      <div className="flex items-center gap-2 justify-between">
                        <span>{u.email}</span>
                        {isAdmin && (
                          <Link
                            href={`/admin/events?authorIds=${u.id}&preset=6m`}
                            variant="tertiaryNoOutline"
                            title="Voir l'historique des événements de cet utilisateur"
                            className="fr-btn--sm fr-btn--icon-left fr-icon-time-line"
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
