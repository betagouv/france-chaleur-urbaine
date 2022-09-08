/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Select, Table, TextInput } from '@dataesr/react-dsfr';
import { useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { RowsParams } from 'src/services/demandsService';
import { Demand } from 'src/types/Summary/Demand';
import AdditionalInformation from './AdditionalInformation';
import Addresse from './Addresse';
import Comment from './Comment';
import Contact from './Contact';
import Contacted from './Contacted';
import {
  Container,
  Distance,
  Filters,
  NoResult,
  TableContainer,
} from './manager.style';
import Status from './Status';
import Tag from './Tag';

const searchKeys: (keyof Demand)[] = ['Nom', 'Prénom', 'Mail'];
const matchFilter = (filter: string, value: string | undefined) => {
  return (
    value &&
    value
      .toString()
      .toLowerCase()
      .replace(/é/g, 'e')
      .includes(filter.toLowerCase())
  );
};

const typeDeChauffageOptions = [
  {
    label: 'Tous',
    value: '',
  },
  {
    label: 'Collectif',
    value: 'collectif',
  },
  {
    label: 'Individuel',
    value: 'individuel',
  },
];

const modeDeChauffageOptions = [
  {
    label: 'Tous',
    value: '',
  },
  {
    label: 'Gaz',
    value: 'gaz',
  },
  {
    label: 'Fioul',
    value: 'fioul',
  },
  {
    label: 'Électricité',
    value: 'électricité',
  },
];

const displyModeDeChauffage = (demand: Demand) => {
  if (
    demand['Mode de chauffage'] &&
    demand['Mode de chauffage'].toLowerCase() === 'électricité'
  ) {
    return 'Électricité';
  } else if (
    demand['Mode de chauffage'] &&
    (demand['Mode de chauffage'].toLowerCase().trim() === 'gaz' ||
      demand['Mode de chauffage'].toLowerCase().trim() === 'fioul')
  ) {
    return `${demand['Mode de chauffage'][0].toUpperCase()}${demand[
      'Mode de chauffage'
    ]
      .slice(1)
      .trim()} ${
      demand['Type de chauffage']
        ? demand['Type de chauffage'].toLowerCase()
        : ''
    }`;
  }
  return demand['Type de chauffage'];
};

const Manager = () => {
  const { demandsService } = useServices();
  const [page, setPage] = useState(1);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);
  const [filter, setFilter] = useState('');
  const [filterModeChauffage, setFilterModeChauffage] = useState('');
  const [filterTypeChauffage, setFilterTypeChauffage] = useState('');

  useEffect(() => {
    demandsService.fetchDemands().then(setDemands);
  }, [demandsService]);

  useEffect(() => {
    let tempDemands = demands;
    if (filter) {
      tempDemands = tempDemands.filter((demand) =>
        searchKeys.some((key) => matchFilter(filter, demand[key] as string))
      );
    }

    if (filterModeChauffage) {
      tempDemands = tempDemands.filter(
        (demand) =>
          demand['Mode de chauffage']?.toLowerCase() === filterModeChauffage
      );
    }

    if (filterTypeChauffage) {
      tempDemands = tempDemands.filter(
        (demand) =>
          demand['Type de chauffage']?.toLowerCase() === filterTypeChauffage
      );
    }

    setFilteredDemands(tempDemands);
    setPage(1);
  }, [filter, filterModeChauffage, filterTypeChauffage, demands]);

  const updateDemand = (demandId: string, demand: Partial<Demand>) => {
    demandsService.updateDemand(demandId, demand).then((response) => {
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
      render: (demand) => <Tag text={displyModeDeChauffage(demand)} />,
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
      <h2>Mes demandes - {demands.length || 'Chargement...'}</h2>
      {demands.length > 0 && (
        <>
          <Filters>
            <TextInput
              label="Rechercher par nom ou par mail:"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <Select
              // @ts-ignore: to fix in react-dsfr
              label="Mode de chauffage:"
              selected={filterModeChauffage}
              // @ts-ignore: to fix in react-dsfr
              onChange={(e) => setFilterModeChauffage(e.target.value)}
              options={modeDeChauffageOptions}
            />
            <Select
              // @ts-ignore: to fix in react-dsfr
              label="Type de chauffage:"
              selected={filterTypeChauffage}
              // @ts-ignore: to fix in react-dsfr
              onChange={(e) => setFilterTypeChauffage(e.target.value)}
              options={typeDeChauffageOptions}
            />
          </Filters>
          <TableContainer>
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
          </TableContainer>
        </>
      )}
    </Container>
  );
};

export default Manager;
