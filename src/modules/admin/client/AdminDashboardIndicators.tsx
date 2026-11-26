import Link from '@/components/ui/Link';
import trpc from '@/modules/trpc/client';

import { adminDashboardIndicators } from '../constants';

/** Permanent counters at the top of the admin dashboard: one compact card per work queue, linking to the page where its items are handled. */
function AdminDashboardIndicators() {
  // counters of things to do: refetched every time the dashboard is shown (the app caches queries forever), then every minute
  const { data: indicators, isLoading } = trpc.admin.getDashboardIndicators.useQuery(undefined, { refetchInterval: 60_000, staleTime: 0 });

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {adminDashboardIndicators.map((indicator) => {
        const count = indicators?.[indicator.key];
        const isPending = count !== undefined && count > 0;
        return (
          <Link
            key={indicator.key}
            href={indicator.href}
            title={indicator.description}
            className="flex flex-col gap-1 rounded-sm p-3 bg-(--background-alt-blue-france) bg-none! transition-colors hover:bg-(--background-alt-blue-france-hover)"
          >
            <span className="flex items-center gap-2 text-2xl font-bold leading-none text-(--text-title-blue-france)">
              {isLoading ? '…' : (count ?? 0)}
              {isPending && (
                <>
                  <span className="fr-icon-warning-fill fr-icon--sm text-(--text-default-warning)" aria-hidden title="Éléments à traiter" />
                  <span className="sr-only">Éléments à traiter</span>
                </>
              )}
            </span>
            <span className="text-sm font-medium leading-tight">{indicator.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default AdminDashboardIndicators;
