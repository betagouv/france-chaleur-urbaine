import { Badge, type BadgeProps } from '@codegouvfr/react-dsfr/Badge';

import Tooltip from '@/components/ui/Tooltip';
import { businessRules } from '@/modules/app/business-rules';
import { type NetworkTrackingState, networkTrackingStateLabels } from '@/modules/demands/constants';

import { recentWindowLabel } from './format';

const lateDelay = businessRules.networkTrackingLateDays.display;
const silentDelay = businessRules.networkTrackingSilentDays.display;

const stateSeverities = {
  late: 'warning',
  no_demand: undefined,
  no_recent_demand: undefined,
  silent: 'error',
  up_to_date: 'success',
} as const satisfies Record<NetworkTrackingState, BadgeProps['severity']>;

const stateDescriptions = {
  late: `Une demande déposée depuis ${recentWindowLabel} attend depuis plus de ${lateDelay}, mais un gestionnaire a agi sur le réseau il y a moins de ${silentDelay}.`,
  no_demand: "Aucune demande validée n'est affectée à ce réseau.",
  no_recent_demand: `Aucune demande validée n'a été déposée sur ce réseau depuis ${recentWindowLabel} : il n'a que des demandes plus anciennes.`,
  silent: `Une demande déposée depuis ${recentWindowLabel} attend depuis plus de ${lateDelay} et aucun gestionnaire n'a agi sur le réseau depuis ${silentDelay}.`,
  up_to_date: `Aucune demande déposée depuis ${recentWindowLabel} n'attend depuis plus de ${lateDelay}.`,
} as const satisfies Record<NetworkTrackingState, string>;

type NetworkTrackingStateBadgeProps = {
  state: NetworkTrackingState;
  /** `sm` in the table, `md` next to the title of the detail page. */
  size?: 'sm' | 'md';
};

/**
 * Tracking state of a network (silent, late, up to date, without recent demand, without demand), with the rule behind it as a tooltip.
 */
export function NetworkTrackingStateBadge({ state, size = 'sm' }: NetworkTrackingStateBadgeProps) {
  return (
    <Tooltip title={stateDescriptions[state]}>
      <Badge small={size === 'sm'} severity={stateSeverities[state]} className="cursor-help whitespace-nowrap">
        {networkTrackingStateLabels[state]}
      </Badge>
    </Tooltip>
  );
}
