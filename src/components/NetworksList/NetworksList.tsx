import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useGridApiRef } from '@mui/x-data-grid';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { ReseauxDeChaleurLimits } from '@components/Map/map-layers';
import Box from '@components/ui/Box';
import Icon from '@components/ui/Icon';
import { ColumnDef, Table } from '@components/ui/Table';
import Text from '@components/ui/Text';
import { Interval } from '@utils/interval';
import { fetchJSON } from '@utils/network';
import { useServices } from 'src/services';
import { percentageMaxInterval } from 'src/services/Map/map-configuration';
import { NetworkToCompare } from 'src/types/Summary/Network';

import NetworkName from './NetworkName';
import NetworksFilter, { intervalFilters, FilterLimits, FilterValues, energiesFilters } from './NetworksFilters';

type DataToDisplay = 'general' | 'mix_energetique';

const NetworksListContainer = styled.div`
  .networks-list-selector {
    font-weight: bold;
    &:not(.active) {
      color: var(--grey-50-1000);
    }
  }
`;

const GeneralFieldsList: string[] = [
  'communes',
  'Gestionnaire',
  'Taux EnR&R',
  'contenu CO2 ACV',
  'contenu CO2',
  'PM',
  'annee_creation',
  'livraisons_totale_MWh',
];
const MixEnergetiqueFieldsList: string[] = [
  'energie_ratio_biomasse',
  'energie_ratio_geothermie',
  'energie_ratio_uve',
  'energie_ratio_chaleurIndustrielle',
  'energie_ratio_solaireThermique',
  'energie_ratio_pompeAChaleur',
  'energie_ratio_gaz',
  'energie_ratio_fioul',
];

export const defaultInterval: Interval = [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];

const emptyFilterLimits: FilterLimits = {
  'Taux EnR&R': defaultInterval,
  'contenu CO2 ACV': defaultInterval,
  PM: defaultInterval,
  livraisons_totale_MWh: defaultInterval,
  annee_creation: defaultInterval,
  energie_ratio_biomasse: percentageMaxInterval,
  energie_ratio_geothermie: percentageMaxInterval,
  energie_ratio_uve: percentageMaxInterval,
  energie_ratio_chaleurIndustrielle: percentageMaxInterval,
  energie_ratio_solaireThermique: percentageMaxInterval,
  energie_ratio_pompeAChaleur: percentageMaxInterval,
  energie_ratio_gaz: percentageMaxInterval,
  energie_ratio_fioul: percentageMaxInterval,
};
const emptyFilterMinValues: FilterValues = {
  ...emptyFilterLimits,
  energieMajoritaire: '',
  gestionnaire: '',
  isClassed: false,
  region: '',
};

const NetworksList = () => {
  const { networksService } = useServices();
  const tableApiRef = useGridApiRef();

  const [allNetworks, setAllNetworks] = useState<NetworkToCompare[]>([]);
  const [filteredNetworks, setFilteredNetworks] = useState<NetworkToCompare[]>([]);

  const [regionsList, setRegionsList] = useState<string[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValues>(emptyFilterMinValues);
  const [filterLimits, setFilterLimits] = useState<FilterLimits>(emptyFilterLimits);
  const [searchValue, setSearchValue] = useState<string>('');

  const [dataToDisplay, setDataToDisplay] = useState<DataToDisplay>('general');
  const [loaded, setLoaded] = useState(false);

  const onSearchValueFilter = useCallback(() => {
    let newFilteredNetworks: NetworkToCompare[] = [];
    if (searchValue) {
      newFilteredNetworks = allNetworks.filter(
        (network: NetworkToCompare) =>
          (network.nom_reseau && network.nom_reseau.includes(searchValue)) ||
          (network.Gestionnaire && network.Gestionnaire.includes(searchValue)) ||
          (network.MO && network.MO.includes(searchValue)) ||
          (network.communes && network.communes.includes(searchValue))
      );
    }
    setFilteredNetworks(newFilteredNetworks);

    if (tableApiRef.current?.setPage) {
      tableApiRef.current.setPage(0);
    }
  }, [allNetworks, searchValue]);

  const onApplyIntervalOrEnergiesFilters = useCallback(
    (filtersType: 'interval' | 'energies', newFilteredNetworks: NetworkToCompare[], newFilterValues: FilterValues) => {
      const filters = filtersType === 'interval' ? intervalFilters : energiesFilters;
      filters.map((filterConf) => {
        const minValue: number = newFilterValues[filterConf.confKey]
          ? newFilterValues[filterConf.confKey][0]
          : filterLimits[filterConf.confKey][0];
        const maxValue: number = newFilterValues[filterConf.confKey]
          ? newFilterValues[filterConf.confKey][1]
          : filterLimits[filterConf.confKey][1];

        if (minValue !== filterLimits[filterConf.confKey][0] || maxValue !== filterLimits[filterConf.confKey][1]) {
          newFilteredNetworks = newFilteredNetworks.filter(
            (network: NetworkToCompare) =>
              ((minValue !== filterLimits[filterConf.confKey][0] && (network[filterConf.confKey] as number) >= minValue) ||
                minValue === filterLimits[filterConf.confKey][0]) &&
              ((maxValue !== filterLimits[filterConf.confKey][1] && (network[filterConf.confKey] as number) <= maxValue) ||
                maxValue === filterLimits[filterConf.confKey][1])
          );
        }
      });
      return newFilteredNetworks;
    },
    [intervalFilters, energiesFilters, filterLimits]
  );

  const onApplyFilters = useCallback(
    (newFilterValues: FilterValues) => {
      let newFilteredNetworks = allNetworks;
      newFilteredNetworks = onApplyIntervalOrEnergiesFilters('interval', newFilteredNetworks, newFilterValues);

      if (newFilterValues.region && newFilterValues.region !== '') {
        newFilteredNetworks = newFilteredNetworks.filter(
          (network: NetworkToCompare) =>
            network.region && network.region.toLowerCase().includes(newFilterValues.region.trim().toLowerCase())
        );
      }

      if (newFilterValues.energieMajoritaire) {
        newFilteredNetworks = newFilteredNetworks.filter(
          (network: NetworkToCompare) =>
            network.energie_max_ratio &&
            network.energie_max_ratio !== '' &&
            network.energie_max_ratio === newFilterValues.energieMajoritaire
        );
      }

      if (newFilterValues.gestionnaire && newFilterValues.gestionnaire !== '') {
        newFilteredNetworks = newFilteredNetworks.filter(
          (network: NetworkToCompare) =>
            network.Gestionnaire && network.Gestionnaire.toLowerCase().includes(newFilterValues.gestionnaire.trim().toLowerCase())
        );
      }

      if (newFilterValues.isClassed) {
        newFilteredNetworks = newFilteredNetworks.filter((network: NetworkToCompare) => network['reseaux classes']);
      }

      newFilteredNetworks = onApplyIntervalOrEnergiesFilters('energies', newFilteredNetworks, newFilterValues);

      setFilteredNetworks(newFilteredNetworks);
      setFilterValues(newFilterValues);
    },
    [allNetworks, intervalFilters, energiesFilters, filterLimits]
  );

  const networkGeneralRowsParams: ColumnDef<NetworkToCompare>[] = useMemo(
    () => [
      {
        field: 'nom_reseau',
        headerName: 'Nom du réseau',
        minWidth: 250,
        sortable: true,
        renderCell: (params) => <NetworkName name={params.row.nom_reseau} isClassed={params.row['reseaux classes']} />,
      },
      {
        field: 'Identifiant reseau',
        headerName: 'Identifiant du réseau',
        minWidth: 200,
        sortable: true,
        renderCell: (params) => <Link href={`/reseaux/${params.row['Identifiant reseau']}`}>{params.row['Identifiant reseau']}</Link>,
      },
      {
        field: 'communes',
        headerName: 'Nom de la ville',
        minWidth: 250,
        sortable: true,
      },
      {
        field: 'Gestionnaire',
        headerName: 'Gestionnaire',
        minWidth: 250,
        sortable: true,
      },
      {
        field: 'Taux EnR&R',
        headerName: 'Taux EnR&R',
        minWidth: 150,
        sortable: true,
        renderCell: (params) => <Text>{params.row['Taux EnR&R'] ? `${params.row['Taux EnR&R']}%` : undefined}</Text>,
      },
      {
        field: 'contenu CO2 ACV',
        renderHeader: () => (
          <Box>
            Contenu CO2 ACV
            <Text fontWeight="regular" mt="1w">
              (gCO<sub>2</sub>/kWh)
            </Text>
          </Box>
        ),
        minWidth: 200,
        sortable: true,
      },
      {
        field: 'contenu CO2',
        renderHeader: () => (
          <Box>
            Contenu CO2
            <Text fontWeight="regular" mt="1w">
              (gCO<sub>2</sub>/kWh)
            </Text>
          </Box>
        ),
        minWidth: 200,
        sortable: true,
      },
      {
        field: 'PM',
        renderHeader: () => (
          <Box>
            Prix moyen
            <Text fontWeight="regular" mt="1w">
              (€TTC/MWh)
            </Text>
          </Box>
        ),
        minWidth: 150,
        sortable: true,
      },
      {
        field: 'annee_creation',
        headerName: 'Année de construction',
        minWidth: 150,
        sortable: true,
      },
      {
        field: 'livraisons_totale_MWh',
        renderHeader: () => (
          <Box>
            Livraison de chaleur annuelle
            <Text fontWeight="regular" mt="1w">
              (MWh)
            </Text>
          </Box>
        ),
        minWidth: 250,
        sortable: true,
        renderCell: (params) => (
          <Text>{params.row.livraisons_totale_MWh ? params.row.livraisons_totale_MWh.toLocaleString('fr-FR') : ''}</Text>
        ),
      },
      {
        field: 'energie_ratio_biomasse',
        headerName: 'Biomasse',
        minWidth: 200,
        sortable: true,
        renderCell: (params) => <Text>{params.row.energie_ratio_biomasse ? params.row.energie_ratio_biomasse.toFixed(2) : 0}%</Text>,
      },
      {
        field: 'energie_ratio_geothermie',
        headerName: 'Géothermie',
        minWidth: 200,
        sortable: true,
        renderCell: (params) => <Text>{params.row.energie_ratio_geothermie ? params.row.energie_ratio_geothermie.toFixed(2) : 0}%</Text>,
      },
      {
        field: 'energie_ratio_uve',
        headerName: 'UVE',
        minWidth: 200,
        sortable: true,
        renderCell: (params) => <Text>{params.row.energie_ratio_uve ? params.row.energie_ratio_uve.toFixed(2) : 0}%</Text>,
      },
      {
        field: 'energie_ratio_chaleurIndustrielle',
        headerName: 'Chaleur industrielle',
        minWidth: 200,
        sortable: true,
        renderCell: (params) => (
          <Text>{params.row.energie_ratio_chaleurIndustrielle ? params.row.energie_ratio_chaleurIndustrielle.toFixed(2) : 0}%</Text>
        ),
      },
      {
        field: 'energie_ratio_solaireThermique',
        headerName: 'Solaire thermique',
        minWidth: 200,
        sortable: true,
        renderCell: (params) => (
          <Text>{params.row.energie_ratio_solaireThermique ? params.row.energie_ratio_solaireThermique.toFixed(2) : 0}%</Text>
        ),
      },
      {
        field: 'energie_ratio_pompeAChaleur',
        headerName: 'Pompe à chaleur',
        minWidth: 200,
        sortable: true,
        renderCell: (params) => (
          <Text>{params.row.energie_ratio_pompeAChaleur ? params.row.energie_ratio_pompeAChaleur.toFixed(2) : 0}%</Text>
        ),
      },
      {
        field: 'energie_ratio_gaz',
        headerName: 'Gaz',
        minWidth: 200,
        sortable: true,
        renderCell: (params) => <Text>{params.row.energie_ratio_gaz ? params.row.energie_ratio_gaz.toFixed(2) : 0}%</Text>,
      },
      {
        field: 'energie_ratio_fioul',
        headerName: 'Fioul',
        minWidth: 200,
        sortable: true,
        renderCell: (params) => <Text>{params.row.energie_ratio_fioul ? params.row.energie_ratio_fioul.toFixed(2) : 0}%</Text>,
      },
    ],
    []
  );

  const onChangeDataToDisplay = useCallback(
    (newDataToDisplay: DataToDisplay) => {
      if (tableApiRef) {
        GeneralFieldsList.forEach((fieldName: string) =>
          tableApiRef.current.setColumnVisibility(fieldName, newDataToDisplay === 'general' ? true : false)
        );
        MixEnergetiqueFieldsList.forEach((fieldName: string) =>
          tableApiRef.current.setColumnVisibility(fieldName, newDataToDisplay === 'general' ? false : true)
        );
        setDataToDisplay(newDataToDisplay);
        if (tableApiRef.current?.setPage) {
          tableApiRef.current.setPage(0);
        }
        setDataToDisplay(newDataToDisplay);
      }
    },
    [tableApiRef, GeneralFieldsList, MixEnergetiqueFieldsList, setDataToDisplay]
  );

  useEffect(() => {
    if (!loaded) {
      (async () => {
        try {
          const networks: NetworkToCompare[] = await networksService.fetch();
          setAllNetworks(networks);
          setFilteredNetworks(networks);

          const newRegionsList: string[] = [];
          networks.forEach((network) => {
            !newRegionsList.includes(network.region.trim()) && newRegionsList.push(network.region.trim());
          });
          newRegionsList.sort();
          setRegionsList(newRegionsList);

          // amend the configuration with metadata limits of networks
          fetchJSON<ReseauxDeChaleurLimits>('/api/map/network-limits').then((limits) => {
            // apply the limits to the filters
            intervalFilters.forEach((filter) => {
              if (limits[filter.rdcLimitKey]) {
                const limitValues =
                  filter.confKey !== 'livraisons_totale_MWh'
                    ? limits[filter.rdcLimitKey]
                    : ([limits[filter.rdcLimitKey][0] * 1000, limits[filter.rdcLimitKey][1] * 1000] as Interval);

                filterValues[filter.confKey] = limitValues;
                filterLimits[filter.confKey] = limitValues;
              }
            });
            setFilterValues(filterValues);
            setFilterLimits(filterLimits);

            onChangeDataToDisplay('general');
            setLoaded(true);
          });
        } finally {
          setTimeout(() => {
            setLoaded(true);
          });
        }
      })();
    }
  }, []);

  return (
    <NetworksListContainer>
      {loaded && (
        <Box py="10w" className="fr-container">
          <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between" pb="4w">
            <Text fontWeight="bold">{filteredNetworks.length}&nbsp;réseaux</Text>
            <Box display="flex" flexDirection="row" alignItems="flex-end" gap="16px">
              <NetworksFilter
                filterLimits={filterLimits}
                filterValues={filterValues}
                regionsList={regionsList}
                onApplyFilters={(minConfig) => onApplyFilters(minConfig)}
              ></NetworksFilter>
              <Input
                label="Rechercher"
                hideLabel
                addon={
                  <Button
                    className="primary"
                    onClick={() => {
                      onSearchValueFilter();
                    }}
                  >
                    <Icon size="sm" name="fr-icon-search-line" />
                  </Button>
                }
                nativeInputProps={{
                  placeholder: 'Rechercher',
                  value: searchValue,
                  onChange: (e) => setSearchValue(e.target.value),
                }}
              />
            </Box>
          </Box>
          <Box flex pb="4w">
            <Button
              priority={dataToDisplay === 'general' ? 'secondary' : 'tertiary'}
              size="small"
              className={`fr-mx-auto networks-list-selector ${dataToDisplay === 'general' ? 'active' : ''}`}
              onClick={() => {
                onChangeDataToDisplay('general');
              }}
            >
              Général
            </Button>
            <Button
              priority={dataToDisplay === 'mix_energetique' ? 'secondary' : 'tertiary'}
              size="small"
              className={`fr-mx-auto networks-list-selector ${dataToDisplay === 'mix_energetique' ? 'active' : ''}`}
              onClick={() => {
                onChangeDataToDisplay('mix_energetique');
              }}
            >
              Mix énergétique
            </Button>
          </Box>
          <Box
            height="100%"
            width="100%"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            style={{ overflow: 'hidden' }}
          >
            <Table
              apiRef={tableApiRef}
              columns={networkGeneralRowsParams}
              rows={filteredNetworks}
              disableColumnMenu
              columnHeaderHeight={100}
              getRowHeight={() => 'auto'}
              hideFooterSelectedRowCount
              loading={!loaded}
              initialState={{
                sorting: {
                  sortModel: [{ field: 'Nom', sort: 'asc' }],
                },
              }}
            />
          </Box>
        </Box>
      )}
    </NetworksListContainer>
  );
};

export default NetworksList;
