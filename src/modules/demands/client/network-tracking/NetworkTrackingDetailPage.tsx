import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb';
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
import { isDefined } from '@/utils/core';
import { formatMW } from '@/utils/strings';

import { ADMIN_DASHBOARD_URL, getNetworkName, NETWORK_TRACKING_URL } from './format';
import { NetworkQuartersTable } from './NetworkQuartersTable';
import { NetworkStatusesTable } from './NetworkStatusesTable';
import { NetworkTrackingFollowUp } from './NetworkTrackingFollowUp';
import { NetworkTrackingIndicators } from './NetworkTrackingIndicators';
import { NetworkTrackingStateBadge } from './NetworkTrackingStateBadge';
import { NetworkTypeBadges } from './NetworkTypeBadges';

const NetworkActivityChart = dynamic(() => import('./NetworkActivityChart').then((module) => module.NetworkActivityChart), {
  loading: () => <Loader size="xl" variant="section" />,
  ssr: false,
});

/**
 * Admin screen detailing how the managers of one network handle its demands: indicators, managers, organization and follow-up, monthly activity, response by quarter and statuses.
 */
export default function NetworkTrackingDetailPage() {
  const router = useRouter();
  const network = zNetworkTrackingInput.safeParse({ networkId: Number(router.query.networkId), networkType: router.query.networkType });
  const { data: tracking, isLoading, error } = trpc.demands.admin.getNetworkTracking.useQuery(network.success ? network.data : skipToken);
  const isNotFound = !network.success || error?.data?.code === 'NOT_FOUND';
  const networkName = tracking ? getNetworkName(tracking.summary) : 'Réseau';
  const demandsCount = tracking ? tracking.summary.recentTotal + tracking.summary.olderTotal : 0;

  return (
    <SimplePage title={`${networkName} - Suivi des réseaux`} mode="authenticated" layout="center">
      <Breadcrumb
        className="mt-0! mb-2!"
        currentPageLabel={networkName}
        segments={[
          { label: 'Administration', linkProps: { href: ADMIN_DASHBOARD_URL } },
          { label: 'Suivi des réseaux', linkProps: { href: NETWORK_TRACKING_URL } },
        ]}
      />
      <div className="flex flex-col gap-8">
        {isLoading && <Loader size="xl" variant="section" />}
        {!isLoading && !tracking && <p>{isNotFound ? 'Ce réseau est introuvable.' : "Le suivi de ce réseau n'a pas pu être chargé."}</p>}
        {tracking && (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Heading as="h1" color="blue-france" className="mb-0!">
                  {networkName}
                </Heading>
                <NetworkTrackingStateBadge state={tracking.summary.state} size="md" />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <NetworkTypeBadges
                  networkType={tracking.summary.networkType}
                  sncuId={tracking.summary.sncuId}
                  extensionsCount={tracking.summary.extensions.length}
                />
                {isDefined(tracking.summary.powerMW) && <span>{formatMW(tracking.summary.powerMW)}</span>}
                {demandsCount > 0 && (
                  <Link href={buildAdminDemandsUrl(buildDemandFilters(tracking.summary.networkId, tracking.summary.networkType, false))}>
                    {demandsCount > 1 ? `Voir les ${demandsCount} demandes` : 'Voir la demande'}
                  </Link>
                )}
              </div>
            </div>

            <NetworkTrackingIndicators summary={tracking.summary} />

            <section className="flex flex-col gap-2">
              <Heading as="h2" size="h5" className="mb-0!">
                Comptes et suivi
              </Heading>
              <NetworkTrackingFollowUp network={tracking.summary} organization={tracking.organization} />
            </section>

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
