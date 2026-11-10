import { Badge, type BadgeProps } from '@codegouvfr/react-dsfr/Badge';

import Tooltip from '@/components/ui/Tooltip';
import { businessRules } from '@/modules/app/business-rules';
import { type NetworkTrackingState, networkTrackingStateLabels } from '@/modules/demands/constants';

const lateDelay = businessRules.networkTrackingLateDays.display;
const silentDelay = businessRules.networkTrackingSilentDays.display;

const stateSeverities = {
  late: 'warning',
  silent: 'error',
  up_to_date: 'success',
} as const satisfies Record<NetworkTrackingState, BadgeProps['severity']>;

const stateDescriptions = {
  late: `Une demande attend depuis plus de ${lateDelay}, mais un gestionnaire a agi sur le réseau il y a moins de ${silentDelay}.`,
  silent: `Une demande attend depuis plus de ${lateDelay} et aucun gestionnaire n'a agi sur le réseau depuis ${silentDelay}.`,
  up_to_date: `Aucune demande n'attend depuis plus de ${lateDelay}.`,
} as const satisfies Record<NetworkTrackingState, string>;

type NetworkTrackingStateBadgeProps = {
  state: NetworkTrackingState;
};

/**
 * Tracking state of a network (silent, late, up to date), with the rule behind it as a tooltip.
 */
export function NetworkTrackingStateBadge({ state }: NetworkTrackingStateBadgeProps) {
  return (
    <Tooltip title={stateDescriptions[state]}>
      <Badge small severity={stateSeverities[state]} className="cursor-help whitespace-nowrap">
        {networkTrackingStateLabels[state]}
      </Badge>
    </Tooltip>
  );
}
