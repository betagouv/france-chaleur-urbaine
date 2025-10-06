import { useEffect, useState } from 'react';

import Select from '@/components/form/dsfr/Select';
import { DEMANDE_STATUS, type DemandStatus } from '@/types/enum/DemandSatus';
import type { Demand } from '@/types/Summary/Demand';

const statusOptions = Object.values(DEMANDE_STATUS).map((status) => ({
  label: status,
  value: status,
}));

const Status = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => Promise<void>;
}) => {
  const [status, setStatus] = useState<DemandStatus>(DEMANDE_STATUS.EMPTY);

  useEffect(() => {
    setStatus(demand.Status || DEMANDE_STATUS.EMPTY);
  }, [demand]);

  return (
    <Select
      label=""
      options={statusOptions}
      placeholder="Sélectionner un statut"
      size="sm"
      nativeSelectProps={{
        onChange: (e) => {
          const newStatus = e.target.value as DemandStatus;
          setStatus(newStatus);
          void updateDemand(demand.id, { Status: newStatus });
        },
        value: status || DEMANDE_STATUS.EMPTY,
      }}
    />
  );
};

export default Status;
