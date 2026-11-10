import type { ReactNode } from 'react';

import Link from '@/components/ui/Link';
import { businessRules } from '@/modules/app/business-rules';
import { buildAdminDemandsUrl, buildDemandFilters } from '@/modules/demands/client/admin-demands-url';
import cx from '@/utils/cx';

import { formatDurationDays, formatElapsedSince, formatResponseRate } from './format';
import { LastManagerAction } from './LastManagerAction';
import type { NetworkTrackingSummary } from './types';

const responseWindow = businessRules.networkTrackingResponseWindowMonths.display;

type NetworkTrackingIndicatorsProps = {
  summary: NetworkTrackingSummary;
};

/**
 * Headline indicators of a network: pending demands, last manager action, response rate and median response delay.
 */
export function NetworkTrackingIndicators({ summary }: NetworkTrackingIndicatorsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <IndicatorCard
        title="Demandes à traiter"
        value={
          <Link
            href={buildAdminDemandsUrl(buildDemandFilters(summary.networkId, summary.networkType, undefined, true))}
            className={cx(summary.pending > 0 && 'text-error')}
          >
            {summary.pending}
          </Link>
        }
        detail={
          summary.oldestPendingSince
            ? `la plus ancienne attend depuis ${formatElapsedSince(summary.oldestPendingSince)}`
            : 'aucune demande en attente'
        }
      />
      <IndicatorCard
        title="Dernière action d'un gestionnaire"
        value={<LastManagerAction date={summary.lastManagerActionAt} />}
        detail="mise à jour ou courriel sur une demande du réseau"
      />
      <IndicatorCard
        title={`Taux de réponse sur ${responseWindow}`}
        value={summary.recentReceived > 0 ? formatResponseRate(summary.recentResponded, summary.recentReceived) : '—'}
        detail={
          summary.recentReceived > 0
            ? `${summary.recentResponded} demande${summary.recentResponded > 1 ? 's' : ''} sur ${summary.recentReceived} reçue${summary.recentReceived > 1 ? 's' : ''}`
            : 'aucune demande reçue sur la période'
        }
      />
      <IndicatorCard
        title="Délai médian de réponse"
        value={summary.medianResponseDays !== null ? formatDurationDays(summary.medianResponseDays) : '—'}
        detail={`entre la réception d'une demande et la première action, sur ${responseWindow}`}
      />
    </div>
  );
}

type IndicatorCardProps = {
  title: string;
  value: ReactNode;
  detail: ReactNode;
};

/**
 * One headline figure with its title and a line of context.
 */
function IndicatorCard({ title, value, detail }: IndicatorCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs text-(--text-mention-grey)">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{detail}</div>
    </div>
  );
}
