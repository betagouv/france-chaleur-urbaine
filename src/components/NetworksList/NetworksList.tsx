import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { type CellContext, type ColumnDefTemplate } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { reseauxDeChaleurFilters } from '@/components/Map/layers/filters';
import { filtresEnergies, percentageMaxInterval } from '@/components/Map/map-configuration';
import ReseauxDeChaleurFilters, { type ReseauxDeChaleurFiltersProps } from '@/components/ReseauxDeChaleurFilters';
import Box from '@/components/ui/Box';
import Drawer from '@/components/ui/Drawer';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import Text from '@/components/ui/Text';
import useReseauxDeChaleurFilters, { type FilterWithLimits } from '@/hooks/useReseauxDeChaleurFilters';
import { gestionnairesFilters, useServices } from '@/services';
import { type NetworkToCompare } from '@/types/Summary/Network';
import { isDefined } from '@/utils/core';
import { exportAsXLSX } from '@/utils/export';
import { type Interval, intervalsEqual } from '@/utils/interval';
import { compareFrenchStrings } from '@/utils/strings';

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
export function filterReseauxDeChaleur(reseauxDeChaleur: NetworkToCompare[], filters: FilterWithLimits): NetworkToCompare[] {
  return reseauxDeChaleur.filter((reseau) => {
    let showReseau = true;

    reseauxDeChaleurFilters
      .filter(({ confKey }) => !intervalsEqual(filters[confKey], filters.limits[confKey]))
      .forEach((reseauxDeChaleurFilter) => {
        const filter = filters[reseauxDeChaleurFilter.confKey];
        const value = reseau[reseauxDeChaleurFilter.valueKey];

        if (typeof value !== 'number' || value < filter[0] || value > filter[1]) {
          showReseau = false;
        }
      });
    filtresEnergies
      .filter(({ confKey }) => !intervalsEqual(filters[`energie_ratio_${confKey}`], percentageMaxInterval))
      .forEach((filtreEnergie) => {
        const filter = filters[`energie_ratio_${filtreEnergie.confKey}`];
        const value = reseau[`energie_ratio_${filtreEnergie.confKey}`];
        if (value < filter[0] || value > filter[1]) {
          showReseau = false;
        }
      });
    filters.energieMobilisee.forEach((energieMobilisee) => {
      if (reseau[`energie_ratio_${energieMobilisee}`] <= 0) {
        showReseau = false;
      }
    });
    if (filters.regions.length > 0 && !filters.regions.includes(reseau.region)) {
      showReseau = false;
    }

    if (filters.gestionnaires.length > 0) {
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
        const selectedGestionnaires = filters.gestionnaires.map((gestionnaire) =>
          gestionnairesFilters.find(({ value }) => value === gestionnaire)?.value?.toLowerCase()
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

const PercentageCell: ColumnDefTemplate<CellContext<NetworkToCompare, any>> = ({ getValue }) => {
  return (getValue() / 100).toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 1 });
};

const NetworksList = () => {
  const { networksService } = useServices();
  const [isDrawerOpened, toggleDrawer] = useState<boolean>(false);
  const [regionsList, setRegionsList] = useState<ReseauxDeChaleurFiltersProps['regionsList']>([]);
  const [allNetworks, setAllNetworks] = useState<NetworkToCompare[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const { filters: objectFilters, nbFilters } = useReseauxDeChaleurFilters();

  let filteredNetworks = filterReseauxDeChaleur(allNetworks, objectFilters || ({} as NonNullable<typeof objectFilters>));

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

  const allNetworkColumns: ColumnDef<NetworkToCompare>[] = useMemo(
    () => [
      {
        accessorKey: 'nom_reseau',
        header: 'Nom du réseau',
        width: '250px',
        filterFn: (row, _, filterValue) => {
          return (
            row.original.nom_reseau?.toLocaleLowerCase().includes(filterValue.toLocaleLowerCase()) ||
            row.original['Identifiant reseau']?.toLocaleLowerCase().includes(filterValue.toLocaleLowerCase())
          );
        },
        cell: (params) => (
          <NetworkName
            name={params.row.original.nom_reseau}
            isClassed={params.row.original['reseaux classes']}
            identifiant={params.row.original['Identifiant reseau']}
          />
        ),
      },
      {
        accessorKey: 'Identifiant reseau',
        header: 'Identifiant',
        width: '130px',
      },
      {
        accessorKey: 'communes',
        header: 'Communes',
        width: '250px',
        sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.original.communes.join(', '), rowB.original.communes.join(', ')),
        cell: ({ getValue }) => <Text>{getValue() ? getValue().join(', ') : undefined}</Text>,
      },
      {
        accessorKey: 'Gestionnaire',
        header: 'Gestionnaire',
        width: '250px',
      },
      {
        accessorKey: 'Taux EnR&R',
        header: 'Taux EnR&R',
        width: '110px',
        align: 'right',
        cell: ({ getValue }) => <Text>{isDefined(getValue()) ? `${getValue()}%` : undefined}</Text>,
      },
      {
        accessorKey: 'contenu CO2 ACV',
        header: () => (
          <Box>
            Contenu CO2 ACV
            <Text fontWeight="regular" mt="1w">
              (gCO<sub>2</sub>/kWh)
            </Text>
          </Box>
        ),
        width: '175px',
        align: 'right',
      },
      {
        accessorKey: 'contenu CO2',
        header: () => (
          <Box>
            Contenu CO2
            <Text fontWeight="regular" mt="1w">
              (gCO<sub>2</sub>/kWh)
            </Text>
          </Box>
        ),
        width: '140px',
        align: 'right',
      },
      {
        accessorKey: 'PM',
        header: () => (
          <Box>
            Prix moyen
            <Text fontWeight="regular" mt="1w">
              (€TTC/MWh)
            </Text>
          </Box>
        ),
        width: '130px',
        align: 'right',
        cellType: 'Price',
        cellProps: {
          maximumFractionDigits: 0,
        },
      },
      {
        accessorKey: 'annee_creation',
        header: 'Année de construction',
        width: '130px',
        align: 'right',
      },
      {
        accessorKey: 'livraisons_totale_MWh',
        header: () => (
          <Box>
            Livraisons de chaleur
            <br />
            annuelles
            <Text fontWeight="regular" mt="1w">
              (GWh)
            </Text>
          </Box>
        ),
        width: '180px',
        align: 'right',
        cellType: 'Number',
        cellProps: {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        },
      },
      {
        accessorKey: 'energie_ratio_biomasse',
        header: 'Biomasse',
        width: '110px',
        align: 'right',
        cell: PercentageCell,
      },
      {
        accessorKey: 'energie_ratio_geothermie',
        header: 'Géothermie',
        width: '110px',
        align: 'right',
        cell: PercentageCell,
      },
      {
        accessorKey: 'energie_ratio_uve',
        header: 'UVE',
        width: '110px',
        align: 'right',
        cell: PercentageCell,
      },
      {
        accessorKey: 'energie_ratio_chaleurIndustrielle',
        header: 'Chaleur industrielle',
        width: '110px',
        align: 'right',
        cell: PercentageCell,
      },
      {
        accessorKey: 'energie_ratio_solaireThermique',
        header: 'Solaire thermique',
        width: '110px',
        align: 'right',
        cell: PercentageCell,
      },
      {
        accessorKey: 'energie_ratio_pompeAChaleur',
        header: 'Pompe à chaleur',
        width: '110px',
        align: 'right',
        cell: PercentageCell,
      },
      {
        accessorKey: 'energie_ratio_gaz',
        header: 'Gaz',
        width: '110px',
        align: 'right',
        cell: PercentageCell,
      },
      {
        accessorKey: 'energie_ratio_fioul',
        header: 'Fioul',
        width: '110px',
        align: 'right',
        cell: PercentageCell,
      },
    ],
    []
  );

  const networkColumns = useMemo(() => {
    return allNetworkColumns.filter((col) => {
      const inGeneralList = GeneralFieldsList.includes((col as any).accessorKey);
      const inMixEnergetiqueList = MixEnergetiqueFieldsList.includes((col as any).accessorKey as any);
      if (!inGeneralList && !inMixEnergetiqueList) {
        // if not in general or mix energetique list, it's always on
        return true;
      }

      return dataToDisplay === 'general' ? inGeneralList : inMixEnergetiqueList;
    });
  }, [dataToDisplay, allNetworkColumns, GeneralFieldsList, MixEnergetiqueFieldsList]);

  useEffect(() => {
    if (loaded) {
      return;
    }
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
  }, []);

  return (
    <NetworksListContainer>
      <Drawer open={isDrawerOpened} onClose={() => toggleDrawer(false)} direction="right" handleOnly={true}>
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
            <Button priority="secondary" size="medium" onClick={() => toggleDrawer(true)}>
              <Icon size="md" name="fr-icon-filter-line" color="var(--text-action-high-blue-france)" />
              Tous les filtres ({nbFilters})
            </Button>
            <Button
              disabled={!filteredNetworks.length}
              onClick={() =>
                exportAsXLSX(`${new Date().toISOString().split('T')[0]}_reseauxDeChaleur.xlsx`, [
                  {
                    data: filteredNetworks,
                    name: 'Général et Mix Énergétique',
                    columns: [
                      {
                        accessorKey: 'nom_reseau',
                        name: 'Nom du réseau',
                      },
                      {
                        accessorKey: 'reseaux classes',
                        name: 'Réseau classé',
                      },
                      {
                        accessorKey: 'Identifiant reseau',
                        name: 'Identifiant',
                      },
                      {
                        accessorKey: 'communes',
                        name: 'Communes',
                      },
                      {
                        accessorKey: 'Gestionnaire',
                        name: 'Gestionnaire',
                      },
                      {
                        accessorKey: 'Taux EnR&R',
                        name: 'Taux EnR&R (%)',
                        precision: 1,
                      },
                      {
                        accessorKey: 'contenu CO2 ACV',
                        name: 'Contenu CO2 ACV (gCO2/kWh)',
                      },
                      {
                        accessorKey: 'contenu CO2',
                        name: 'Contenu CO2 (gCO2/kWh)',
                      },
                      {
                        accessorKey: 'PM',
                        name: 'Prix moyen (€TTC/MWh)',
                      },
                      {
                        accessorKey: 'annee_creation',
                        name: 'Année de construction',
                      },
                      {
                        accessorKey: 'livraisons_totale_MWh',
                        name: 'Livraisons de chaleur annuelles (GWh)',
                        precision: 1,
                      },
                      {
                        accessorKey: 'energie_ratio_biomasse',
                        name: 'Biomasse (%)',
                        precision: 1,
                      },
                      {
                        accessorKey: 'energie_ratio_geothermie',
                        name: 'Géothermie (%)',
                        precision: 1,
                      },
                      {
                        accessorKey: 'energie_ratio_uve',
                        name: 'UVE (%)',
                        precision: 1,
                      },
                      {
                        accessorKey: 'energie_ratio_chaleurIndustrielle',
                        name: 'Chaleur industrielle (%)',
                        precision: 1,
                      },
                      {
                        accessorKey: 'energie_ratio_solaireThermique',
                        name: 'Solaire thermique (%)',
                        precision: 1,
                      },
                      {
                        accessorKey: 'energie_ratio_pompeAChaleur',
                        name: 'Pompe à chaleur (%)',
                        precision: 1,
                      },
                      {
                        accessorKey: 'energie_ratio_gaz',
                        name: 'Gaz (%)',
                        precision: 1,
                      },
                      {
                        accessorKey: 'energie_ratio_fioul',
                        name: 'Fioul (%)',
                        precision: 1,
                      },
                    ],
                  },
                ])
              }
              iconId="fr-icon-file-download-line"
              iconPosition="right"
            >
              Exporter
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
            onClick={() => setDataToDisplay('general')}
          >
            Général
          </Button>
          <Button
            priority={dataToDisplay === 'mix_energetique' ? 'secondary' : 'tertiary'}
            size="small"
            className={`fr-mx-auto networks-list-selector ${dataToDisplay === 'mix_energetique' ? 'active' : ''}`}
            onClick={() => setDataToDisplay('mix_energetique')}
          >
            Mix énergétique
          </Button>
        </Box>
        <Box height="100%" width="100%" display="flex" flexDirection="column" justifyContent="space-between" style={{ overflow: 'hidden' }}>
          <TableSimple
            columns={networkColumns}
            data={filteredNetworks}
            loading={!loaded}
            padding="sm"
            rowHeight={124}
            initialSortingState={[{ id: 'Identifiant reseau', desc: false }]}
          />
        </Box>
        <Text size="xs" className="fr-hint-text" mt="2w">
          Sources : L’ensemble des données sont extraites des enquêtes réalisées par la Fedene Réseaux de chaleur et de froid avec le
          concours de l’association AMORCE, sous tutelle du service des données et études statistiques (SDES) du ministère de la transition
          écologique. L'année considérée varie en fonction de la disponibilité actuelle des données. Livraisons et mix énergétique : 2023.
          Données tarifaires : 2022. Taux ENRR et contenu CO2 (direct et ACV) : 2023 ou moyenne des années 2021, 2022 et 2023, sur la base
          de l'
          <Link href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051520810" isExternal>
            arrêté DPE du 11 avril 2025
          </Link>
          .
        </Text>
      </Box>
    </NetworksListContainer>
  );
};

export default NetworksList;
