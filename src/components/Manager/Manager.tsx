import { Table } from '@dataesr/react-dsfr';
import { useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { RowsParams } from 'src/services/demandsService';
import { displayModeDeChauffage } from 'src/services/Map/businessRules/demands';
import { Demand } from 'src/types/Summary/Demand';
import AdditionalInformation from './AdditionalInformation';
import Addresse from './Addresse';
import Comment from './Comment';
import Contact from './Contact';
import Contacted from './Contacted';
import {
  Container,
  Distance,
  NoResult,
  TableContainer,
} from './Manager.styles';
import ManagerHeader from './ManagerHeader';
import Status from './Status';
import Tag from './Tag';

const Manager = () => {
  const { demandsService } = useServices();
  const [page, setPage] = useState(1);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);

  useEffect(() => {
    demandsService.fetch().then(setDemands);
  }, [demandsService]);

  useEffect(() => {
    setPage(1);
  }, [filteredDemands]);

  const updateDemand = (demandId: string, demand: Partial<Demand>) => {
    demandsService.update(demandId, demand).then((response) => {
      const index = demands.findIndex((d) => d.id === demandId);
      demands.splice(index, 1, response);
      setDemands([...demands]);
    });
  };

  const demandRowsParams: RowsParams[] = [
    {
      name: 'Statut',
      label: 'Statut',
      render: (demand) => (
        <Status demand={demand} updateDemand={updateDemand} />
      ),
    },
    {
      name: 'Prospect recontacté',
      label: 'Prospect recontacté',
      render: (demand) => (
        <Contacted demand={demand} updateDemand={updateDemand} />
      ),
    },
    {
      name: 'Contact',
      label: 'Contact',
      render: (demand) => <Contact demand={demand} />,
    },
    {
      name: 'Adresse',
      label: 'Adresse',
      render: (demand) => <Addresse demand={demand} />,
    },
    {
      name: 'Date de la demande',
      label: 'Date de demande',
      render: (demand) =>
        new Date(demand['Date demandes']).toLocaleDateString(),
    },
    {
      name: 'Type de chauffage',
      label: 'Type',
      render: (demand) => <Tag text={demand.Structure} />,
    },
    {
      name: 'Mode de chauffage',
      label: 'Mode de chauffage',
      render: (demand) => <Tag text={displayModeDeChauffage(demand)} />,
    },
    {
      name: 'Distance au réseau',
      label: 'Distance au réseau',
      render: (demand) =>
        demand['Distance au réseau'] && (
          <Distance>{demand['Distance au réseau']} m</Distance>
        ),
    },
    {
      name: 'Nb logements Conso gaz',
      label: 'Nb logements Conso gaz',
      render: (demand) => <AdditionalInformation demand={demand} />,
    },
    {
      name: 'Commentaires',
      label: 'Commentaires',
      render: (demand) => (
        <Comment demand={demand} updateDemand={updateDemand} />
      ),
    },
  ];

  return (
    <Container>
      {demands.length > 0 && (
        <>
          <ManagerHeader
            demands={demands}
            setFilteredDemands={setFilteredDemands}
          />
          <TableContainer>
            <div>
              {filteredDemands.length > 0 ? (
                <Table
                  columns={demandRowsParams}
                  data={filteredDemands}
                  rowKey="N° de dossier"
                  pagination
                  paginationPosition="center"
                  page={page}
                  setPage={setPage}
                />
              ) : (
                <NoResult>Aucun résultats</NoResult>
              )}
            </div>
          </TableContainer>
        </>
      )}
    </Container>
  );
};

export default Manager;
