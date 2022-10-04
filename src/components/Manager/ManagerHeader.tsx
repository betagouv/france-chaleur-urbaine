import { Button, Select, TextInput } from '@dataesr/react-dsfr';
import { useEffect, useState } from 'react';
import { Oval } from 'react-loader-spinner';
import { useServices } from 'src/services';
import { Demand } from 'src/types/Summary/Demand';
import { ExportButton, Filter, Filters } from './ManagerHeader.styles';

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

const searchKeys: (keyof Demand)[] = ['Nom', 'Prénom', 'Mail'];

const cleanValue = (value: string | undefined): string => {
  return value
    ? value
        .toString()
        .toLowerCase()
        .replace(/é/g, 'e')
        .replace(/è/g, 'e')
        .replace(/à/g, 'a')
        .replace(/ô/g, 'o')
        .toLowerCase()
    : '';
};

const matchFilter = (filter: string, value: string | undefined) => {
  return cleanValue(value).includes(cleanValue(filter));
};

const ManagerHeader = ({
  demands,
  setFilteredDemands,
}: {
  demands: Demand[];
  setFilteredDemands: (demands: Demand[]) => void;
}) => {
  const { demandsService } = useServices();

  const [exporting, setExporting] = useState(false);

  const [nameFilter, setNameFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [filterModeChauffage, setFilterModeChauffage] = useState('');
  const [filterTypeChauffage, setFilterTypeChauffage] = useState('');

  useEffect(() => {
    let filteredDemands = demands;
    if (nameFilter) {
      filteredDemands = filteredDemands.filter((demand) =>
        searchKeys.some((key) => matchFilter(nameFilter, demand[key] as string))
      );
    }

    if (addressFilter) {
      filteredDemands = filteredDemands.filter((demand) =>
        matchFilter(addressFilter, demand.Adresse)
      );
    }

    if (filterModeChauffage) {
      filteredDemands = filteredDemands.filter(
        (demand) =>
          demand['Mode de chauffage']?.toLowerCase() === filterModeChauffage
      );
    }

    if (filterTypeChauffage) {
      filteredDemands = filteredDemands.filter(
        (demand) =>
          demand['Type de chauffage']?.toLowerCase() === filterTypeChauffage
      );
    }

    setFilteredDemands(filteredDemands);
  }, [
    addressFilter,
    nameFilter,
    filterModeChauffage,
    filterTypeChauffage,
    demands,
    setFilteredDemands,
  ]);

  return (
    <Filters>
      <Filter>
        <TextInput
          label="Rechercher par nom ou par mail:"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
      </Filter>
      <Filter>
        <TextInput
          label="Rechercher par adresse:"
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
        />
      </Filter>
      <Filter>
        <Select
          label="Mode de chauffage:"
          selected={filterModeChauffage}
          onChange={(e: any) => setFilterModeChauffage(e.target.value)}
          options={modeDeChauffageOptions}
        />
      </Filter>
      <Filter>
        <Select
          label="Type de chauffage:"
          selected={filterTypeChauffage}
          onChange={(e) => setFilterTypeChauffage(e.target.value)}
          options={typeDeChauffageOptions}
        />
      </Filter>
      <ExportButton>
        {exporting ? (
          <Oval height={40} width={40} />
        ) : (
          <Button
            onClick={() => {
              setExporting(true);
              demandsService.export().finally(() => {
                setExporting(false);
              });
            }}
          >
            Exporter
          </Button>
        )}
      </ExportButton>
    </Filters>
  );
};

export default ManagerHeader;
