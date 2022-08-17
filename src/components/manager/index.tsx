import { Table } from '@dataesr/react-dsfr';
import { useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { DemandSummary } from 'src/types/Summary/Demand';

const columns = [
  {
    name: 'Nom',
    label: 'Nom',
    render: (demands: DemandSummary) =>
      `${demands.Nom}${demands.Prénom ? ` ${demands.Prénom}` : ''}`,
  },
  { name: 'Structure', label: 'Structure' },
  { name: 'Établissement', label: 'Établissement' },
  { name: 'Mail', label: 'Mail' },
  { name: 'Adresse', label: 'Adresse' },
  { name: 'Distance au réseau', label: 'Distance au réseau' },
  { name: 'Type de chauffage', label: 'Type de chauffage' },
  { name: 'Mode de chauffage', label: 'Mode de chauffage' },
];
const Manager = () => {
  const { demandsService } = useServices();
  const [demands, setDemands] = useState<DemandSummary[]>([]);

  useEffect(() => {
    demandsService.fetchDemands().then(setDemands);
  }, [demandsService]);
  return (
    <>
      <h2>Mes demandes - {demands.length || 'Chargement...'}</h2>
      {demands.length > 0 && (
        <Table
          fixedHeader
          columns={columns}
          data={demands}
          rowKey="id"
          pagination
          paginationPosition="center"
        />
      )}
    </>
  );
};

export default Manager;
