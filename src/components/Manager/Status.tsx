import { useEffect, useState } from 'react';

import { DEMANDE_STATUS } from 'src/types/enum/DemandSatus';
import { Demand } from 'src/types/Summary/Demand';

import { StatusSelect } from './Status.styles';

const statusOptions = Object.values(DEMANDE_STATUS).map((status: string) => ({
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
  const [status, setStatus] = useState('');
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
          setStatus(e.target.value);
          updateDemand(demand.id, { Status: e.target.value });
        },
        value: status ?? DEMANDE_STATUS.EMPTY,
      }}
    />
  );
};

export default Status;
