import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import trpc from '@/modules/trpc/client';

import { adminDashboardIndicators } from '../constants';

/** « À traiter » section of the admin dashboard: one card per indicator, linking to the page where the items are handled. */
function AdminDashboardIndicators() {
  const { data: indicators, isLoading } = trpc.admin.getDashboardIndicators.useQuery(undefined, { refetchInterval: 60_000 });

  return (
    <section>
      <Heading as="h2" size="h5" color="grey" className="mb-4">
        À traiter
      </Heading>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {adminDashboardIndicators.map((indicator) => {
          const count = indicators?.[indicator.key];
          const isPending = count !== undefined && count > 0;
          return (
            <Link
              key={indicator.key}
              href={indicator.href}
              title={indicator.description}
              className="flex flex-col gap-1 rounded-sm p-4 bg-(--background-alt-blue-france) bg-none! transition-colors hover:bg-(--background-alt-blue-france-hover)"
            >
              <span className="flex items-center gap-2 text-3xl font-bold leading-none text-(--text-title-blue-france)">
                {isLoading ? '…' : (count ?? 0)}
                {isPending && (
                  <>
                    <span className="fr-icon-warning-fill text-(--text-default-warning)" aria-hidden title="Éléments à traiter" />
                    <span className="sr-only">Éléments à traiter</span>
                  </>
                )}
              </span>
              <span className="text-sm font-medium">{indicator.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default AdminDashboardIndicators;
