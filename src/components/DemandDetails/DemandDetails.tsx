import { useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { Demand } from 'src/types/Summary/Demand';

const columns = [
  {
    name: 'Nom',
    label: 'Nom',
    render: (demands: Demand) =>
      `${demands.Nom}${demands.Prénom ? ` ${demands.Prénom}` : ''}`,
  },
  { name: 'Structure', label: 'Structure' },
  { name: 'Établissement', label: 'Établissement' },
  { name: 'Mail', label: 'Email' },
  { name: 'Adresse', label: 'Adresse' },
  { name: 'Distance au réseau', label: 'Distance au réseau' },
  { name: 'Type de chauffage', label: 'Type de chauffage' },
  { name: 'Mode de chauffage', label: 'Mode de chauffage' },
];

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
        {columns.map(({ name, label, render }) => (
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
