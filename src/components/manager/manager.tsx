/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Select, Table, TextInput } from '@dataesr/react-dsfr';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { demandRowsParams } from 'src/services/demandsService';
import { Demand } from 'src/types/Summary/Demand';
import { Filters, NoResult } from './manager.style';

const columns = [
  ...demandRowsParams,
  {
    name: 'view-more',
    label: 'Voir plus',
    render: (demand: Demand) => (
      <Link href={`/demandes/${demand.id}`}>Voir les details</Link>
    ),
  },
];

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

  return (
    <>
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
          {filteredDemands.length > 0 ? (
            <Table
              fixedHeader
              columns={columns}
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
        </>
      )}
    </>
  );
};

export default Manager;
