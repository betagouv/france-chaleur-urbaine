import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useGridApiRef } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import Box from '@components/ui/Box';
import Icon from '@components/ui/Icon';
import { ColumnDef, Table } from '@components/ui/Table';
import Text from '@components/ui/Text';
import { Interval } from '@utils/interval';
import { fetchJSON } from '@utils/network';
import { useServices } from 'src/services';
import {
  emptyFilterLimits,
  emptyFilterValues,
  energiesFilters,
  FilterLimits,
  FilterValues,
  intervalFilters,
  IntervalFiltersLimitKey,
} from 'src/types/NetworksFilters';
import { NetworkToCompare } from 'src/types/Summary/Network';

import NetworkName from './NetworkName';
import NetworksFilter from './NetworksFilters';

type DataToDisplay = 'general' | 'mix_energetique';

const NetworksListContainer = styled.div`
  .MuiDataGrid-root {
    overflow-y: hidden;
    --DataGrid-hasScrollY: 0;
  }
  .networks-list-selector {
    font-weight: bold;
    &:not(.active) {
      color: var(--grey-50-1000);
    }
  }
  .MuiDataGrid-row {
    &.even,
    &.odd {
      background-color: #fff;
      padding-top: 8px;
      padding-bottom: 8px;
    }
    &:not(.MuiDataGrid-row--firstVisible) {
      --rowBorderColor: var(--border-contrast-grey);
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

const NetworksList = () => {
  const { networksService } = useServices();
  const tableApiRef = useGridApiRef();

  const [allNetworks, setAllNetworks] = useState<NetworkToCompare[]>([]);
  const [filteredNetworks, setFilteredNetworks] = useState<NetworkToCompare[]>([]);

  const [regionsList, setRegionsList] = useState<string[]>([]);
  const [filterLimits, setFilterLimits] = useState<FilterLimits>(emptyFilterLimits);
  const [filterValues, setFilterValues] = useState<FilterValues>(emptyFilterValues);
  const [searchValue, setSearchValue] = useState<string>('');

  const [dataToDisplay, setDataToDisplay] = useState<DataToDisplay>('general');
  const [loaded, setLoaded] = useState(false);

  const onApplySearchValueFilter = useCallback(
    (newFilteredNetworks: NetworkToCompare[]) => {
      if (searchValue) {
        newFilteredNetworks = newFilteredNetworks.filter(
          (network: NetworkToCompare) =>
            (network.nom_reseau && network.nom_reseau.includes(searchValue)) ||
            (network.Gestionnaire && network.Gestionnaire.includes(searchValue)) ||
            (network.MO && network.MO.includes(searchValue)) ||
            (network.communes && network.communes.includes(searchValue)) ||
            (network['Identifiant reseau'] && network['Identifiant reseau'].includes(searchValue))
        );
      }
      return newFilteredNetworks;
    },
    [allNetworks, searchValue]
  );

  const onSearchValueFilter = useCallback(() => {
    //Search on networks already filtered
    const newFilteredNetworks = onApplySearchValueFilter(filteredNetworks);
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

      //Apply search value
      newFilteredNetworks = onApplySearchValueFilter(newFilteredNetworks);

      setFilteredNetworks(newFilteredNetworks);
      setFilterValues(newFilterValues);

      if (tableApiRef.current?.setPage) {
        tableApiRef.current.setPage(0);
      }
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
        renderCell: (params) => (
          <NetworkName
            name={params.row.nom_reseau}
            isClassed={params.row['reseaux classes']}
            identifiant={params.row['Identifiant reseau']}
          />
        ),
      },
      {
        field: 'Identifiant reseau',
        headerName: 'Identifiant',
        minWidth: 120,
        sortable: true,
      },
      {
        field: 'communes',
        headerName: 'Communes',
        minWidth: 250,
        sortable: true,
        sortComparator: (v1, v2, param1, param2) => `${param1.value.join(', ')}`.localeCompare(param2.value.join(', ')),
        renderCell: (params) => <Text>{params.row.communes ? params.row.communes.join(', ') : undefined}</Text>,
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
        minWidth: 110,
        sortable: true,
        align: 'right',
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
        minWidth: 175,
        sortable: true,
        align: 'right',
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
        minWidth: 140,
        sortable: true,
        align: 'right',
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
        minWidth: 130,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{params.row.PM ? Math.round(params.row.PM) : ''}</Text>,
      },
      {
        field: 'annee_creation',
        headerName: 'Année de construction',
        minWidth: 130,
        sortable: true,
        align: 'right',
      },
      {
        field: 'livraisons_totale_MWh',
        renderHeader: () => (
          <Box>
            Livraisons de chaleur
            <br />
            annuelles
            <Text fontWeight="regular" mt="1w">
              (GWh)
            </Text>
          </Box>
        ),
        minWidth: 180,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{params.row.livraisons_totale_MWh ? params.row.livraisons_totale_MWh.toFixed(1) : ''}</Text>,
      },
      {
        field: 'energie_ratio_biomasse',
        headerName: 'Biomasse',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{params.row.energie_ratio_biomasse ? params.row.energie_ratio_biomasse.toFixed(1) : 0}%</Text>,
      },
      {
        field: 'energie_ratio_geothermie',
        headerName: 'Géothermie',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{params.row.energie_ratio_geothermie ? params.row.energie_ratio_geothermie.toFixed(1) : 0}%</Text>,
      },
      {
        field: 'energie_ratio_uve',
        headerName: 'UVE',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{params.row.energie_ratio_uve ? params.row.energie_ratio_uve.toFixed(1) : 0}%</Text>,
      },
      {
        field: 'energie_ratio_chaleurIndustrielle',
        headerName: 'Chaleur industrielle',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => (
          <Text>{params.row.energie_ratio_chaleurIndustrielle ? params.row.energie_ratio_chaleurIndustrielle.toFixed(1) : 0}%</Text>
        ),
      },
      {
        field: 'energie_ratio_solaireThermique',
        headerName: 'Solaire thermique',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => (
          <Text>{params.row.energie_ratio_solaireThermique ? params.row.energie_ratio_solaireThermique.toFixed(1) : 0}%</Text>
        ),
      },
      {
        field: 'energie_ratio_pompeAChaleur',
        headerName: 'Pompe à chaleur',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => (
          <Text>{params.row.energie_ratio_pompeAChaleur ? params.row.energie_ratio_pompeAChaleur.toFixed(1) : 0}%</Text>
        ),
      },
      {
        field: 'energie_ratio_gaz',
        headerName: 'Gaz',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{params.row.energie_ratio_gaz ? params.row.energie_ratio_gaz.toFixed(1) : 0}%</Text>,
      },
      {
        field: 'energie_ratio_fioul',
        headerName: 'Fioul',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{params.row.energie_ratio_fioul ? params.row.energie_ratio_fioul.toFixed(1) : 0}%</Text>,
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
          newRegionsList.sort((a, b) => a.localeCompare(b));
          setRegionsList(newRegionsList);

          // amend the configuration with metadata limits of networks
          fetchJSON<IntervalFiltersLimitKey>('/api/networks/list-to-compare-limits').then((limits) => {
            // apply the limits to the filters
            intervalFilters.forEach((filter) => {
              if (limits[filter.limitKey]) {
                filterValues[filter.confKey] = limits[filter.limitKey];
                filterLimits[filter.confKey] = limits[filter.limitKey];
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
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                      onSearchValueFilter();
                    }
                  },
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
              sortingOrder={['desc', 'asc']}
              initialState={{
                sorting: {
                  sortModel: [{ field: 'nom_reseau', sort: 'asc' }],
                },
              }}
              pageSize={20}
            />
          </Box>
        </Box>
      )}
    </NetworksListContainer>
  );
};

export default NetworksList;
