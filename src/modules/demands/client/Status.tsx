import { useEffect, useRef, useState } from 'react';

import Select from '@/components/form/dsfr/Select';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { useAuthentication } from '@/modules/auth/client/hooks';
import {
  type DemandStatus,
  demandStatusDefault,
  demandStatuses,
  getUnrealizableReasonLabel,
  type UnrealizableReasonForm,
} from '@/modules/demands/constants';
import type { Demand } from '@/modules/demands/types';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import cx from '@/utils/cx';

import { UnrealizableReason } from './UnrealizableReason';
import { UnrealizableReasonDialog } from './UnrealizableReasonDialog';
import { getUnrealizableDialogContext } from './unrealizable-tracking';

const Status = ({
  demand,
  updateDemand,
  disabled = false,
  className = '',
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
  disabled?: boolean;
  className?: string;
}) => {
  const { user } = useAuthentication();
  const [status, setStatus] = useState<DemandStatus>(demandStatusDefault);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const hasCancelledReasonDialogRef = useRef(false);

  useEffect(() => {
    setStatus(demand.Status || demandStatusDefault);
  }, [demand]);

  const handleStatusChange = (newStatus: DemandStatus) => {
    // « Non réalisable » is only applied once its reason is confirmed: the select keeps the current status meanwhile
    if (newStatus === DEMANDE_STATUS.UNREALISABLE) {
      setIsReasonDialogOpen(true);
      return;
    }
    if (hasCancelledReasonDialogRef.current) {
      hasCancelledReasonDialogRef.current = false;
      trackPostHogEvent('demand:status_selected_after_unrealizable_cancel', {
        ...getUnrealizableDialogContext(demand, user?.role, 'status_select'),
        status: newStatus,
      });
    }
    setStatus(newStatus);
    void updateDemand(demand.id, { Status: newStatus });
  };

  const handleReasonConfirm = async (reason: UnrealizableReasonForm) => {
    hasCancelledReasonDialogRef.current = false;
    // no local `setStatus`: the status follows the demand once the update is applied
    await updateDemand(demand.id, { Status: DEMANDE_STATUS.UNREALISABLE, ...reason });
    setIsReasonDialogOpen(false);
  };

  const handleReasonCancel = () => {
    hasCancelledReasonDialogRef.current = true;
    setIsReasonDialogOpen(false);
  };

  return (
    // block wrapper: table cells are flex rows, the reason must sit under the select
    <div className="w-full">
      <Select
        label=""
        options={demandStatuses.map((status) => ({
          // Le picto n'est affiché que dans la liste déroulante (pas dans le badge)
          label: 'icon' in status ? `${status.icon} ${status.label}` : status.label,
          value: status.label /** For now, we use the label as the value as we use legacy values */,
        }))}
        placeholder="Sélectionner un statut"
        size="sm"
        nativeSelectProps={{
          'aria-label': 'Statut de la demande',
          disabled,
          onChange: (e) => handleStatusChange(e.target.value),
          value: status || demandStatusDefault,
        }}
        // the reason reads as part of the status: no field margin between them
        className={cx(className, getUnrealizableReasonLabel(demand) && 'mb-0!')}
      />
      <UnrealizableReason demand={demand} />
      <UnrealizableReasonDialog
        demand={demand}
        open={isReasonDialogOpen}
        source="status_select"
        onCancel={handleReasonCancel}
        onConfirm={handleReasonConfirm}
      />
    </div>
  );
};

export default Status;
