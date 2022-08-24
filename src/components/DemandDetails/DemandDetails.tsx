import { useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { demandRowsParams } from 'src/services/demandsService';
import { Demand } from 'src/types/Summary/Demand';

function DemandDetails({ demandId }: { demandId: string }) {
  const { demandsService } = useServices();
  const [demand, setDemand] = useState<Demand | null>(null);

  useEffect(() => {
    demandsService.fetchDemand(demandId).then((record) => {
      setDemand(record);
    });
  }, [demandId, demandsService]);

  return (
    <div>
      <h2>Detail de la demande ref. {demandId}</h2>
      <ul>
        {demandRowsParams.map(({ name, label, render }) => (
          <>
            <li key={name}>
              {label}&nbsp;:{' '}
              {demand && render
                ? render(demand)
                : demand?.[name as keyof Demand]}
            </li>
          </>
        ))}
      </ul>
    </div>
  );
}

export default DemandDetails;
