import { useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { DEMANDE_STATUS } from 'src/types/enum/DemandSatus';
import { Demand } from 'src/types/Summary/Demand';
import { StatusSelect } from './Status.styles';

const statusOptions = [
  {
    value: '',
    label: '- Status de la demande -',
    disabled: true,
  },
].concat(
  Object.values(DEMANDE_STATUS).map((status: string) => ({
    label: status,
    value: status,
    disabled: false,
  }))
);

const Status = ({ demand }: { demand: Demand }) => {
  const { demandsService } = useServices();

  const [status, setStatus] = useState('');
  useEffect(() => {
    setStatus(demand.Status);
  }, [demand]);
  return (
    <StatusSelect
      selected={status}
      options={statusOptions}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Fix in react-DSFR
      onChange={(e) => {
        demandsService.updateDemand(demand.id, {
          Status: e.target.value,
        });
        setStatus(e.target.value);
      }}
    />
  );
};

export default Status;
