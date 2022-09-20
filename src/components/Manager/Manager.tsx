import { Table } from '@dataesr/react-dsfr';
import { useCallback, useEffect, useState } from 'react';
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
  ColHeader,
  Container,
  Distance,
  NoResult,
  TableContainer,
} from './Manager.styles';
import ManagerHeader from './ManagerHeader';
import Status from './Status';
import Tag from './Tag';

type SortParamType = {
  key?: keyof Demand;
  order?: 'asc' | 'desc';
};

const getSortBy =
  (arr: Demand[]) => (key?: keyof Demand, order?: 'asc' | 'desc') => {
    if (!arr.length) return [];
    if (!key || !order) {
      return [...arr];
    }
    return [...arr].sort((_a, _b) => {
      const a = _a?.[key] as number;
      const b = _b?.[key] as number;
      return order === 'desc'
        ? typeof a === 'undefined' || a < b
          ? 1
          : -1
        : typeof a === 'undefined' || a > b
        ? 1
        : -1;
    });
  };

const defaultSort: {
  key?: keyof Demand;
  order?: 'asc' | 'desc';
} = { key: 'Date demandes', order: 'desc' };

const Manager = () => {
  const { demandsService } = useServices();
  const [page, setPage] = useState(1);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);
  const [sort, setSort] = useState<SortParamType>(defaultSort);

  const handleSort = useCallback(
    (key: keyof Demand) => () => {
      const order =
        sort.key !== key || !sort.order
          ? 'desc'
          : sort.order === 'desc'
          ? 'asc'
          : undefined;
      setSort(order ? { key, order } : defaultSort);
    },
    [sort]
  );

  const onFilterUpdate = useCallback(
    (demands: Demand[]) => {
      const sortedDemands = getSortBy(demands)(sort.key, sort.order);
      setFilteredDemands(sortedDemands);
      setPage(1);
    },
    [sort]
  );

  useEffect(() => {
    demandsService.fetch().then(setDemands);
  }, [demandsService]);

  const updateDemand = useCallback(
    (demandId: string, demand: Partial<Demand>) => {
      demandsService.update(demandId, demand).then((response) => {
        const index = demands.findIndex((d) => d.id === demandId);
        demands.splice(index, 1, response);
        setDemands([...demands]);
      });
    },
    [demands, demandsService]
  );

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
      name: 'Date demandes',
      label: (
        <ColHeader
          sort={sort.key === 'Date demandes' ? sort.order : undefined}
          onClick={handleSort('Date demandes')}
        >
          Date de la demande
        </ColHeader>
      ),

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
      label: (
        <ColHeader
          sort={sort.key === 'Distance au réseau' ? sort.order : undefined}
          onClick={handleSort('Distance au réseau')}
        >
          Distance au réseau
        </ColHeader>
      ),
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
            setFilteredDemands={onFilterUpdate}
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
