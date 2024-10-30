import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useGridApiRef } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import XLSX from 'xlsx';

import { reseauxDeChaleurFilters } from '@components/Map/map-layers';
import ReseauxDeChaleurFilters, { ReseauxDeChaleurFiltersProps } from '@components/ReseauxDeChaleurFilters';
import Box from '@components/ui/Box';
import Drawer from '@components/ui/Drawer';
import Icon from '@components/ui/Icon';
import { ColumnDef, Table } from '@components/ui/Table';
import Text from '@components/ui/Text';
import useReseauxDeChaleurFilters, { type Filters } from '@hooks/useReseauxDeChaleurFilters';
import { Interval } from '@utils/interval';
import { gestionnairesFilters, useServices } from 'src/services';
import { filtresEnergies } from 'src/services/Map/map-configuration';
import { NetworkToCompare } from 'src/types/Summary/Network';

import NetworkName from './NetworkName';

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
  .MuiDataGrid-virtualScroller {
    overflow-y: hidden;
  }
  .MuiDataGrid-row {
    &.even,
    &.odd {
      background-color: #fff;
      padding-top: 0;
      padding-bottom: 8px;
    }
    &:not(.MuiDataGrid-row--firstVisible) {
      --rowBorderColor: var(--border-contrast-grey);
    }
  }
`;

export const GeneralFieldsList = [
  'communes',
  'Gestionnaire',
  'Taux EnR&R',
  'contenu CO2 ACV',
  'contenu CO2',
  'PM',
  'annee_creation',
  'livraisons_totale_MWh',
] as const satisfies ReadonlyArray<keyof NetworkToCompare>;

const MixEnergetiqueFieldsList = [
  'energie_ratio_biomasse',
  'energie_ratio_geothermie',
  'energie_ratio_uve',
  'energie_ratio_chaleurIndustrielle',
  'energie_ratio_solaireThermique',
  'energie_ratio_pompeAChaleur',
  'energie_ratio_gaz',
  'energie_ratio_fioul',
] as const satisfies ReadonlyArray<keyof NetworkToCompare>;

export const defaultInterval: Interval = [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];

const FiltersBox = styled(Box)`
  max-width: 400px;
  padding: 16px;
  overflow: auto;
  .fr-label {
    font-size: 0.9rem;
  }
`;
export function filterReseauxDeChaleur(reseauxDeChaleur: NetworkToCompare[], filters: Filters['reseauxDeChaleur']): NetworkToCompare[] {
  const filterKeys = Object.keys(filters);

  return reseauxDeChaleur.filter((reseau) => {
    let showReseau = true;

    reseauxDeChaleurFilters
      .filter(({ confKey }) => filterKeys.includes(confKey))
      .forEach((reseauxDeChaleurFilter) => {
        const filter = filters[reseauxDeChaleurFilter.confKey];
        const value = reseau[reseauxDeChaleurFilter?.valueKey];

        if (value < filter[0] || value > filter[1]) {
          showReseau = false;
        }
      });
    filtresEnergies
      .filter(({ confKey }) => filterKeys.includes(`energie_ratio_${confKey}`))
      .forEach((filtreEnergie) => {
        const filter = filters[`energie_ratio_${filtreEnergie.confKey}`];
        const value = reseau[`energie_ratio_${filtreEnergie.confKey}`];
        if (value < filter[0] || value > filter[1]) {
          showReseau = false;
        }
      });
    (filters.energieMobilisee || []).forEach((energieMobilisee) => {
      if (reseau[`energie_ratio_${energieMobilisee}`] <= 0) {
        showReseau = false;
      }
    });
    if (filters.regions && !filters.regions.includes(reseau.region)) {
      showReseau = false;
    }

    if (filters.gestionnaires) {
      if (filters.gestionnaires.includes('autre')) {
        // If 'autre' is selected, exclude networks whose gestionnaire matches any unselected filter
        const gestionnairesToExclude = gestionnairesFilters
          .filter(({ value }) => !filters.gestionnaires.includes(value))
          .map(({ label }) => label?.toLowerCase());

        if (gestionnairesToExclude.some((gestionnaireToExclude) => reseau.Gestionnaire?.toLowerCase().includes(gestionnaireToExclude))) {
          showReseau = false;
        }
      } else {
        // Otherwise only show networks whose gestionnaire matches one of the selected filters
        const selectedGestionnaires = filters.gestionnaires.map(
          (gestionnaire) => gestionnairesFilters.find(({ value }) => value === gestionnaire)?.value?.toLowerCase()
        );

        if (
          !selectedGestionnaires.some(
            (selectedGestionnaire) => selectedGestionnaire && reseau.Gestionnaire?.toLowerCase().includes(selectedGestionnaire)
          )
        ) {
          showReseau = false;
        }
      }
    }
    if (filters.isClassed && !reseau['reseaux classes']) {
      showReseau = false;
    }

    return showReseau;
  });
}

const formatPercentage = (value?: number | string) =>
  value ? ((value as number) / 100).toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 1 }) : undefined;

const formatNumber = (value?: number | string) => (value ? (value as number).toFixed(1) : undefined);

const formatPrice = (value?: number | string) =>
  value ? (value as number).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : undefined;

const exportColumns: {
  field: keyof NetworkToCompare;
  columnName: string;
  precision?: number;
}[] = [
  {
    field: 'nom_reseau',
    columnName: 'Nom du réseau',
  },
  {
    field: 'reseaux classes',
    columnName: 'Réseau classé',
  },
  {
    field: 'Identifiant reseau',
    columnName: 'Identifiant',
  },
  {
    field: 'communes',
    columnName: 'Communes',
  },
  {
    field: 'Gestionnaire',
    columnName: 'Gestionnaire',
  },
  {
    field: 'Taux EnR&R',
    columnName: 'Taux EnR&R (%)',
    precision: 1,
  },
  {
    field: 'contenu CO2 ACV',
    columnName: 'Contenu CO2 ACV (gCO2/kWh)',
  },
  {
    field: 'contenu CO2',
    columnName: 'Contenu CO2 (gCO2/kWh)',
  },
  {
    field: 'PM',
    columnName: 'Prix moyen (€TTC/MWh)',
  },
  {
    field: 'annee_creation',
    columnName: 'Année de construction',
  },
  {
    field: 'livraisons_totale_MWh',
    columnName: 'Livraisons de chaleur annuelles (GWh)',
    precision: 1,
  },
  {
    field: 'energie_ratio_biomasse',
    columnName: 'Biomasse (%)',
    precision: 1,
  },
  {
    field: 'energie_ratio_geothermie',
    columnName: 'Géothermie (%)',
    precision: 1,
  },
  {
    field: 'energie_ratio_uve',
    columnName: 'UVE (%)',
    precision: 1,
  },
  {
    field: 'energie_ratio_chaleurIndustrielle',
    columnName: 'Chaleur industrielle (%)',
    precision: 1,
  },
  {
    field: 'energie_ratio_solaireThermique',
    columnName: 'Solaire thermique (%)',
    precision: 1,
  },
  {
    field: 'energie_ratio_pompeAChaleur',
    columnName: 'Pompe à chaleur (%)',
    precision: 1,
  },
  {
    field: 'energie_ratio_gaz',
    columnName: 'Gaz (%)',
    precision: 1,
  },
  {
    field: 'energie_ratio_fioul',
    columnName: 'Fioul (%)',
    precision: 1,
  },
];
const downloadAsCsv = (allNetworks: NetworkToCompare[]) => {
  const workbook = XLSX.utils.book_new();

  const data: Record<string, any>[] = [];

  allNetworks.forEach((network) => {
    const row: Record<string, any> = {};

    exportColumns.forEach((col) => {
      let value = network[col.field];
      if (Array.isArray(value)) {
        value = value.join(',');
      } else if (typeof value === 'boolean') {
        value = value ? 'Oui' : 'Non';
      } else if (typeof value === 'number') {
        value = parseFloat(value.toFixed(typeof col.precision === 'number' ? col.precision : 0));
      } else {
        value = value?.toString();
      }

      row[col.columnName] = value;
    });

    data.push(row);
  });

  const generalSheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, generalSheet, 'Général et Mix Énergétique');

  // Create a Blob from the XLSX workbook
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${new Date().toISOString().split('T')[0]}_reseauxDeChaleur.xlsx`;
  link.click();

  URL.revokeObjectURL(url);
};

const NetworksList = () => {
  const { networksService } = useServices();
  const tableApiRef = useGridApiRef();
  const [isDrawerOpened, toggleDrawer] = useState<boolean>(false);
  const [regionsList, setRegionsList] = useState<ReseauxDeChaleurFiltersProps['regionsList']>([]);
  const [allNetworks, setAllNetworks] = useState<NetworkToCompare[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const { filters: objectFilters, countFilters } = useReseauxDeChaleurFilters();
  const nbFilters = countFilters('reseauxDeChaleur');

  let filteredNetworks = filterReseauxDeChaleur(
    allNetworks,
    objectFilters?.reseauxDeChaleur || ({} as NonNullable<typeof objectFilters.reseauxDeChaleur>)
  );

  if (searchValue) {
    const searchValueLowerCase = searchValue.toLocaleLowerCase();

    filteredNetworks = filteredNetworks.filter(
      (network: NetworkToCompare) =>
        (network.nom_reseau && network.nom_reseau.toLocaleLowerCase().includes(searchValueLowerCase)) ||
        (network.Gestionnaire && network.Gestionnaire.toLocaleLowerCase().includes(searchValueLowerCase)) ||
        (network.region && network.region.toLocaleLowerCase().includes(searchValueLowerCase)) ||
        (network.communes && network.communes.join(', ').toLocaleLowerCase().includes(searchValueLowerCase)) ||
        (network['Identifiant reseau'] && network['Identifiant reseau'].toLocaleLowerCase().includes(searchValueLowerCase))
    );
  }

  const [dataToDisplay, setDataToDisplay] = useState<DataToDisplay>('general');
  const [loaded, setLoaded] = useState(false);

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
        renderCell: (params) => <Text>{formatPrice(params.row.PM)}</Text>,
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
        renderCell: (params) => <Text>{formatNumber(params.row.livraisons_totale_MWh)}</Text>,
      },
      {
        field: 'energie_ratio_biomasse',
        headerName: 'Biomasse',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{formatPercentage(params.row.energie_ratio_biomasse)}</Text>,
      },
      {
        field: 'energie_ratio_geothermie',
        headerName: 'Géothermie',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{formatPercentage(params.row.energie_ratio_geothermie)}</Text>,
      },
      {
        field: 'energie_ratio_uve',
        headerName: 'UVE',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{formatPercentage(params.row.energie_ratio_uve)}</Text>,
      },
      {
        field: 'energie_ratio_chaleurIndustrielle',
        headerName: 'Chaleur industrielle',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{formatPercentage(params.row.energie_ratio_chaleurIndustrielle)}</Text>,
      },
      {
        field: 'energie_ratio_solaireThermique',
        headerName: 'Solaire thermique',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{formatPercentage(params.row.energie_ratio_solaireThermique)}</Text>,
      },
      {
        field: 'energie_ratio_pompeAChaleur',
        headerName: 'Pompe à chaleur',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{formatPercentage(params.row.energie_ratio_pompeAChaleur)}</Text>,
      },
      {
        field: 'energie_ratio_gaz',
        headerName: 'Gaz',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{formatPercentage(params.row.energie_ratio_gaz)}</Text>,
      },
      {
        field: 'energie_ratio_fioul',
        headerName: 'Fioul',
        minWidth: 110,
        sortable: true,
        align: 'right',
        renderCell: (params) => <Text>{formatPercentage(params.row.energie_ratio_fioul)}</Text>,
      },
    ],
    []
  );

  const onChangeDataToDisplay = useCallback(
    (newDataToDisplay: DataToDisplay) => {
      if (tableApiRef && tableApiRef.current) {
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
    if (loaded && tableApiRef && tableApiRef.current) {
      onChangeDataToDisplay('general');
    }
  }, [loaded, tableApiRef]);

  useEffect(() => {
    if (!loaded) {
      (async () => {
        try {
          const networks: NetworkToCompare[] = await networksService.fetch();
          setAllNetworks(networks);

          const newRegionsList: ReseauxDeChaleurFiltersProps['regionsList'] = [];
          networks.forEach((network) => {
            if (!newRegionsList.find(({ name }) => name === network.region.trim())) {
              newRegionsList.push({ name: network.region.trim(), coord: `${network.lon},${network.lat}` });
            } else {
              const index = newRegionsList.findIndex(({ name }) => name === network.region.trim());
              const existingCoords = newRegionsList[index].coord.split(',');
              // Calculate average position between existing and new coordinates
              const avgLon = (parseFloat(existingCoords[0]) + network.lon) / 2;
              const avgLat = (parseFloat(existingCoords[1]) + network.lat) / 2;
              newRegionsList[index].coord = `${avgLon},${avgLat}`;
            }
          });

          newRegionsList.sort((a, b) => a.name.localeCompare(b.name));
          setRegionsList(newRegionsList);

          setLoaded(true);
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
      <Drawer open={isDrawerOpened} onClose={() => toggleDrawer(false)} anchor="right">
        <FiltersBox>
          <h3>Filtres{nbFilters > 0 ? ` (${nbFilters})` : ''}</h3>
          <Text fontSize="13px" lineHeight="18px" mb="2w">
            Filtre uniquement sur les réseaux de chaleur existants, pour lesquels les données sont disponibles.
          </Text>
          <ReseauxDeChaleurFilters regionsList={regionsList} linkTo="map" />
        </FiltersBox>
      </Drawer>
      <Box py="10w" className="fr-container">
        <Box display="flex" gap="16px" flexWrap="wrap" flexDirection="row" alignItems="center" justifyContent="space-between" pb="4w">
          <Text fontWeight="bold">{loaded ? filteredNetworks.length : '-'}&nbsp;réseaux</Text>
          <Box display="flex" flexWrap="wrap" flexDirection="row" alignItems="flex-end" gap="16px">
            <Button
              priority="secondary"
              size="medium"
              onClick={() => {
                toggleDrawer(true);
              }}
            >
              <Icon size="md" name="fr-icon-filter-line" color="var(--text-action-high-blue-france)" />
              Tous les filtres ({countFilters('reseauxDeChaleur')})
            </Button>
            <Button
              disabled={!filteredNetworks.length}
              onClick={() => downloadAsCsv(allNetworks)}
              iconId="fr-icon-file-download-line"
              iconPosition="right"
            >
              Exporter toutes les données
            </Button>
            <Input
              label="Rechercher"
              hideLabel
              addon={
                <Button className="primary">
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
        <Box height="100%" width="100%" display="flex" flexDirection="column" justifyContent="space-between" style={{ overflow: 'hidden' }}>
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
                sortModel: [{ field: 'Identifiant reseau', sort: 'asc' }],
              },
            }}
            pageSize={15}
          />
        </Box>
        <Text size="xs" className="fr-hint-text" mt="2w">
          Sources : Enquête annuelle des réseaux de chaleur et de froid (EARCF), édition 2023 portant sur l’année 2022, réalisée par la
          Fedene Réseaux de chaleur et de froid avec le concours de l’association AMORCE, sous tutelle du service des données et études
          statistiques (SDES) du ministère de la transition écologique. Excepté pour les taux EnR&R et contenus CO2 : la source est l’
          <a href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049925781" target="_blank" rel="noreferrer noopener">
            Arrêté du 5 juillet 2024
          </a>{' '}
          (DPE) réalisé sur la base des données portant sur l'année 2022 ou sur une moyenne 2020-2021-2022.
        </Text>
      </Box>
    </NetworksListContainer>
  );
};

export default NetworksList;
