import { useEffect, useState } from 'react';
import { Demand } from 'src/types/Summary/Demand';
import { DEMANDE_STATUS } from 'src/types/enum/DemandSatus';
import { StatusSelect } from './Status.styles';

const statusOptions = Object.values(DEMANDE_STATUS).map((status: string) => ({
  label: status,
  value: status,
  disabled: false,
}));

const Status = ({
  demand,
  updateDemand,
}: {
  demand: Demand;
  updateDemand: (demandId: string, demand: Partial<Demand>) => void;
}) => {
  const [status, setStatus] = useState('');
  useEffect(() => {
    setStatus(demand.Status);
  }, [demand]);

  return (
    <StatusSelect
      label=""
      options={statusOptions}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Fix in react-DSFR
      nativeSelectProps={{
        onChange: (e) => {
          setStatus(e.target.value);
          updateDemand(demand.id, { Status: e.target.value });
        },
        value: status,
      }}
    />
  );
};

export default Status;
