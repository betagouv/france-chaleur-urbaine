import { skipToken } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import { buildAdminDemandsUrl, buildDemandFilters } from '@/modules/demands/client/admin-demands-url';
import { zNetworkTrackingInput } from '@/modules/demands/constants';
import trpc from '@/modules/trpc/client';

import { NetworkQuartersTable } from './NetworkQuartersTable';
import { NetworkStatusesTable } from './NetworkStatusesTable';
import { NetworkTrackingIndicators } from './NetworkTrackingIndicators';
import { NetworkTrackingStateBadge } from './NetworkTrackingStateBadge';

const NetworkActivityChart = dynamic(() => import('./NetworkActivityChart').then((module) => module.NetworkActivityChart), {
  loading: () => <Loader size="xl" variant="section" />,
  ssr: false,
});

/**
 * Admin screen detailing how the managers of one network handle its demands: indicators, monthly activity, response by quarter and statuses.
 */
export default function NetworkTrackingDetailPage() {
  const router = useRouter();
  const network = zNetworkTrackingInput.safeParse({ networkId: Number(router.query.networkId), networkType: router.query.networkType });
  const { data: tracking, isLoading } = trpc.demands.admin.getNetworkTracking.useQuery(network.success ? network.data : skipToken);
  const networkName = tracking ? (tracking.summary.name ?? `Réseau ${tracking.summary.networkId}`) : 'Réseau';

  return (
    <SimplePage title={`${networkName} - Suivi des réseaux`} mode="authenticated" layout="center">
      <div className="flex flex-col gap-8">
        <Link href="/admin/reseaux/suivi" className="self-start text-sm">
          ← Suivi des réseaux
        </Link>

        {isLoading && <Loader size="xl" variant="section" />}
        {!isLoading && !tracking && <p>Aucune demande validée n'est affectée à ce réseau.</p>}
        {tracking && (
          <>
            <div className="flex flex-col gap-2">
              <Heading as="h1" color="blue-france" className="mb-0!">
                {networkName}
              </Heading>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <NetworkTrackingStateBadge state={tracking.summary.state} />
                <span>
                  {[
                    tracking.summary.sncuId,
                    tracking.summary.networkType === 'reseau_de_chaleur' ? 'Réseau existant' : 'Réseau en construction',
                    tracking.summary.gestionnaire,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                <Link
                  href={buildAdminDemandsUrl(
                    buildDemandFilters(tracking.summary.networkId, tracking.summary.networkType, undefined, false)
                  )}
                >
                  Voir les {tracking.summary.total} demandes
                </Link>
                <Link href={`/admin/reseaux/stats?reseaux_search=${encodeURIComponent(networkName)}`}>Comptes et relances</Link>
              </div>
            </div>

            <NetworkTrackingIndicators summary={tracking.summary} />

            <section className="flex flex-col gap-2">
              <Heading as="h2" size="h5" className="mb-0!">
                Activité mensuelle
              </Heading>
              <NetworkActivityChart months={tracking.months} />
            </section>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <section className="flex min-w-0 flex-col gap-2">
                <Heading as="h2" size="h5" className="mb-0!">
                  Réponse par trimestre
                </Heading>
                <NetworkQuartersTable quarters={tracking.quarters} />
              </section>
              <section className="flex min-w-0 flex-col gap-2">
                <Heading as="h2" size="h5" className="mb-0!">
                  Demandes par statut
                </Heading>
                <NetworkStatusesTable summary={tracking.summary} statuses={tracking.statuses} />
              </section>
            </div>
          </>
        )}
      </div>
    </SimplePage>
  );
}
