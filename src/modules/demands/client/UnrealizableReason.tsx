import { getUnrealizableReasonLabel } from '@/modules/demands/constants';
import type { Demand } from '@/modules/demands/types';

type UnrealizableReasonProps = {
  demand: Pick<Demand, 'Status' | 'unrealizable_detail' | 'unrealizable_reason'>;
};

/**
 * Reason and precision given when the demand was closed as « Non réalisable », shown under its status.
 * Renders nothing for any other status.
 */
export function UnrealizableReason({ demand }: UnrealizableReasonProps) {
  const reasonLabel = getUnrealizableReasonLabel(demand);

  return reasonLabel ? (
    <div className="mt-1 text-xs whitespace-normal">
      <div className="font-bold">{reasonLabel}</div>
      {demand.unrealizable_reason && demand.unrealizable_detail && <div className="italic">{demand.unrealizable_detail}</div>}
    </div>
  ) : null;
}
