import { Table } from '@dataesr/react-dsfr';
import { useCallback, useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { RowsParams } from 'src/services/demands';
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
  NoResult,
  TableContainer,
} from './Manager.styles';
import ManagerHeader from './ManagerHeader';
import Status from './Status';
import Tag from './Tag';

type SortParamType = {
  key: keyof Demand;
  backupKey?: keyof Demand;
  order: 'asc' | 'desc';
};

const getValueToSort = (
  demand: Demand,
  key: keyof Demand,
  backupKey?: keyof Demand
) =>
  !backupKey || demand[key] !== undefined ? demand[key] : demand[backupKey];

const getSortBy = (arr: Demand[]) => (sort: SortParamType) => {
  if (!arr.length) return [];
  if (!sort.key || !sort.order) {
    return [...arr];
  }
  return [...arr].sort((_a, _b) => {
    const a = getValueToSort(_a, sort.key, sort.backupKey);
    const b = getValueToSort(_b, sort.key, sort.backupKey);
    let sortResult = 0;
    if (typeof a === 'undefined') {
      if (typeof b === 'undefined') {
        sortResult = 0;
      } else {
        sortResult = 1;
      }
    } else {
      if (typeof b === 'undefined') {
        sortResult = -1;
      } else {
        sortResult = a < b ? 1 : -1;
      }
    }
    return sort.order === 'desc' ? sortResult : -1 * sortResult;
  });
};

const defaultSort: SortParamType = { key: 'Date demandes', order: 'desc' };

const Manager = () => {
  const { demandsService } = useServices();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);
  const [sort, setSort] = useState<SortParamType>(defaultSort);

  const handleSort = useCallback(
    (key: keyof Demand, backupKey?: keyof Demand) => () => {
      const order =
        sort.key !== key || !sort.order
          ? 'desc'
          : sort.order === 'desc'
          ? 'asc'
          : undefined;
      setSort(order ? { key, backupKey, order } : defaultSort);
    },
    [sort]
  );

  const onFilterUpdate = useCallback(
    (demands: Demand[]) => {
      const sortedDemands = getSortBy(demands)(sort);
      setFilteredDemands(sortedDemands);
    },
    [sort]
  );

  useEffect(() => {
    demandsService.fetch().then((values) => {
      setDemands(values);
      setLoading(false);
    });
  }, [demandsService]);

  const updateDemand = useCallback(
    (demandId: string, demand: Partial<Demand>) => {
      demandsService.update(demandId, demand).then((response) => {
        if (response) {
          const index = demands.findIndex((d) => d.id === demandId);
          demands.splice(index, 1, response);
          setDemands([...demands]);
        }
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
          width="100px"
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
          sort={
            sort.key === 'Gestionnaire Distance au réseau'
              ? sort.order
              : undefined
          }
          onClick={handleSort(
            'Gestionnaire Distance au réseau',
            'Distance au réseau'
          )}
        >
          Distance au réseau (m)
        </ColHeader>
      ),
      render: (demand) => (
        <AdditionalInformation
          demand={demand}
          field="Distance au réseau"
          updateDemand={updateDemand}
        />
      ),
    },
    { name: 'Identifiant réseau', label: 'ID réseau le plus proche' },
    {
      name: 'Nb logements',
      label: 'Nb logements (lots)',
      render: (demand) => (
        <AdditionalInformation
          demand={demand}
          field="Logement"
          updateDemand={updateDemand}
        />
      ),
    },
    {
      name: 'Conso gaz',
      label: 'Conso gaz (MWh)',
      render: (demand) => (
        <AdditionalInformation
          demand={demand}
          field="Conso"
          updateDemand={updateDemand}
        />
      ),
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
      <ManagerHeader
        demands={demands}
        setFilteredDemands={onFilterUpdate}
        setPage={setPage}
      />
      {demands.length > 0 ? (
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
      ) : (
        <h2>
          {loading
            ? 'Chargement de vos données en cours...'
            : "Vous n'avez pas encore reçu de demandes"}
        </h2>
      )}
    </Container>
  );
};

export default Manager;
