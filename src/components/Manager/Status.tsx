import { useEffect, useState } from 'react';

import { DEMANDE_STATUS, type DemandStatus } from '@/types/enum/DemandSatus';
import { type Demand } from '@/types/Summary/Demand';

import { StatusSelect } from './Status.styles';

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
  const [status, setStatus] = useState<DemandStatus | ''>(DEMANDE_STATUS.EMPTY);

  useEffect(() => {
    setStatus(demand.Status);
  }, [demand]);

  return (
    <StatusSelect
      label=""
      options={statusOptions}
      placeholder="Sélectionner un statut"
      nativeSelectProps={{
        onChange: (e) => {
          const newStatus = e.target.value as DemandStatus;
          setStatus(newStatus);
          updateDemand(demand.id, { Status: newStatus });
        },
        value: status ?? DEMANDE_STATUS.EMPTY,
      }}
    />
  );
};

export default Status;
