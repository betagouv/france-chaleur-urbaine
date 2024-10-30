import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { useEffect, useState } from 'react';

import Input from '@components/form/dsfr/Input';
import AsyncButton from '@components/ui/AsyncButton';
import Box from '@components/ui/Box';
import { useServices } from 'src/services';
import { DEMANDE_STATUS } from 'src/types/enum/DemandSatus';
import { Demand } from 'src/types/Summary/Demand';

import { Filter, Filters } from './ManagerHeader.styles';

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

const statusOptions = [{ label: 'Tous', value: '' }].concat(
  Object.values(DEMANDE_STATUS).map((status: string) => ({
    label: status,
    value: status,
  }))
);

const searchKeys: (keyof Demand)[] = ['Nom', 'Prénom', 'Mail'];

const cleanValue = (value: string | undefined): string => {
  return value
    ? value.toString().toLowerCase().replace(/é/g, 'e').replace(/è/g, 'e').replace(/à/g, 'a').replace(/ô/g, 'o').toLowerCase()
    : '';
};

const matchFilter = (filter: string, value: string | undefined) => {
  return cleanValue(value).includes(cleanValue(filter));
};

const ManagerHeader = ({ demands, setFilteredDemands }: { demands: Demand[]; setFilteredDemands: (demands: Demand[]) => void }) => {
  const { exportService } = useServices();

  const [gestionnaireOptions, setGestionnaireOptions] = useState<{ label: string; value: string }[]>([]);

  const [nameFilter, setNameFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [filterModeChauffage, setFilterModeChauffage] = useState('');
  const [filterTypeChauffage, setFilterTypeChauffage] = useState('');
  const [statusFilter, setStatusFiler] = useState('');
  const [gestionnaireFilter, setGestionnaireFilter] = useState('');

  useEffect(() => {
    setGestionnaireOptions([
      {
        label: 'Tous',
        value: '',
      },
      ...demands
        .map((demand) => demand['Affecté à'])
        .filter((gestionnaire, index, gestionnaires) => gestionnaire && gestionnaires.indexOf(gestionnaire) === index)
        .sort((a, b) => a.localeCompare(b))
        .map((gestionnaire) => ({
          label: gestionnaire,
          value: gestionnaire,
        })),
    ]);
  }, [demands]);

  useEffect(() => {
    let filteredDemands = demands;
    if (nameFilter) {
      filteredDemands = filteredDemands.filter((demand) => searchKeys.some((key) => matchFilter(nameFilter, demand[key] as string)));
    }

    if (addressFilter) {
      filteredDemands = filteredDemands.filter((demand) => matchFilter(addressFilter, demand.Adresse));
    }
    if (statusFilter === 'En attente de prise en charge') {
      filteredDemands = filteredDemands.filter((demand) => !demand.Status || demand.Status === statusFilter);
    } else if (statusFilter) {
      filteredDemands = filteredDemands.filter((demand) => demand.Status === statusFilter);
    }

    if (filterModeChauffage) {
      filteredDemands = filteredDemands.filter((demand) => demand['Mode de chauffage']?.toLowerCase() === filterModeChauffage);
    }

    if (filterTypeChauffage) {
      filteredDemands = filteredDemands.filter((demand) => demand['Type de chauffage']?.toLowerCase() === filterTypeChauffage);
    }

    if (gestionnaireFilter) {
      filteredDemands = filteredDemands.filter((demand) => demand['Affecté à'] === gestionnaireFilter);
    }

    setFilteredDemands(filteredDemands);
  }, [addressFilter, nameFilter, statusFilter, filterModeChauffage, filterTypeChauffage, gestionnaireFilter, demands, setFilteredDemands]);

  return (
    <Filters>
      <Filter>
        <Input
          label="Rechercher par nom ou par mail:"
          nativeInputProps={{
            type: 'email',
            required: true,
            value: nameFilter,
            onChange: (e) => setNameFilter(e.target.value),
          }}
        />
      </Filter>
      <Filter>
        <Input
          label="Rechercher par adresse:"
          nativeInputProps={{
            type: 'email',
            required: true,
            value: addressFilter,
            onChange: (e) => setAddressFilter(e.target.value),
          }}
        />
      </Filter>
      <Filter>
        <Select
          label="Statut:"
          options={statusOptions}
          nativeSelectProps={{
            onChange: (e) => setStatusFiler(e.target.value),
            value: statusFilter,
          }}
        />
      </Filter>
      <Filter>
        <Select
          label="Mode de chauffage:"
          options={modeDeChauffageOptions}
          nativeSelectProps={{
            onChange: (e) => setFilterModeChauffage(e.target.value),
            value: filterModeChauffage,
          }}
        />
      </Filter>
      <Filter>
        <Select
          label="Type de chauffage:"
          options={typeDeChauffageOptions}
          nativeSelectProps={{
            onChange: (e) => setFilterTypeChauffage(e.target.value),
            value: filterTypeChauffage,
          }}
        />
      </Filter>
      {gestionnaireOptions.length > 1 && (
        <Filter>
          <Select
            label="Gestionnaire:"
            options={gestionnaireOptions}
            nativeSelectProps={{
              onChange: (e) => setGestionnaireFilter(e.target.value),
              value: gestionnaireFilter,
            }}
          />
        </Filter>
      )}
      <Box display="flex" flexGrow="1" width="fit-content" justifyContent="flex-end" alignItems="flex-end">
        <AsyncButton onClick={async () => exportService.exportXLSX('demands')}>Exporter</AsyncButton>
      </Box>
    </Filters>
  );
};

export default ManagerHeader;
