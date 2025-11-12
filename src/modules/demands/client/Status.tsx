import { useEffect, useState } from 'react';

import Select from '@/components/form/dsfr/Select';
import { type DemandStatus, demandStatusDefault, demandStatuses } from '@/modules/demands/constants';
import type { Demand } from '@/modules/demands/types';

const Status = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
}) => {
  const [status, setStatus] = useState<DemandStatus>(demandStatusDefault);

  useEffect(() => {
    setStatus(demand.Status || demandStatusDefault);
  }, [demand]);

  return (
    <Select
      label=""
      options={demandStatuses.map((status) => ({
        label: status.label,
        value: status.label /** For now, we use the label as the value as we use legacy values */,
      }))}
      placeholder="Sélectionner un statut"
      size="sm"
      nativeSelectProps={{
        onChange: (e) => {
          const newStatus = e.target.value;
          setStatus(newStatus);
          void updateDemand(demand.id, { Status: newStatus });
        },
        value: status || demandStatusDefault,
      }}
    />
  );
};

export default Status;
