import { GridRowSelectionModel, useGridApiRef } from '@mui/x-data-grid';
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapRef } from 'react-map-gl/maplibre';

import Hoverable from '@components//Hoverable';
import HoverableIcon from '@components/Hoverable/HoverableIcon';
import Map from '@components/Map';
import Box from '@components/ui/Box';
import Icon from '@components/ui/Icon';
import { Table, type ColumnDef } from '@components/ui/Table';
import { useServices } from 'src/services';
import { displayModeDeChauffage } from 'src/services/Map/businessRules/demands';
import { createMapConfiguration } from 'src/services/Map/map-configuration';
import { MapMarkerInfos } from 'src/types/MapComponentsInfos';
import { Point } from 'src/types/Point';
import { Demand } from 'src/types/Summary/Demand';

import AdditionalInformation from './AdditionalInformation';
import Comment from './Comment';
import Contact from './Contact';
import Contacted from './Contacted';
import { ColHeader, CollapseMap, Container, ManagerContainer, MapContainer, NoResult, TableContainer } from './Manager.styles';
import ManagerHeader from './ManagerHeader';
import Status from './Status';
import Tag from './Tag';

type MapCenterLocation = {
  center: Point;
  zoom: number;
};

const Manager = () => {
  const { demandsService } = useServices();
  const tableApiRef = useGridApiRef();
  const mapRef = useRef<MapRef>() as MutableRefObject<MapRef>;

  const [loading, setLoading] = useState(true);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);

  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [mapPins, setMapPins] = useState<MapMarkerInfos[]>([]);
  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();

  useEffect(() => {
    (async () => {
      try {
        const demands = await demandsService.fetch();
        setDemands(demands);
      } finally {
        setTimeout(() => {
          setLoading(false);
        });
      }
    })();
  }, []);

  const highlightPin = useCallback(
    (selectedPinId: string) => {
      setMapPins((currentMapPins) => [
        ...currentMapPins.map((pin) => ({
          ...pin,
          color: pin.id == selectedPinId ? 'red' : '#4550e5',
        })),
      ]);
    },
    [setMapPins]
  );

  // will highlight the pin, center on it and select the row in the table
  const onMapPinClick = useCallback(
    (demandId: string) => {
      highlightPin(demandId);

      tableApiRef.current.setRowSelectionModel([demandId]);

      const pageSize = tableApiRef.current.state.pagination.paginationModel.pageSize;
      const rowIndex = tableApiRef.current.getSortedRowIds().indexOf(demandId);
      const pageNumber = Math.floor(rowIndex / pageSize);
      tableApiRef.current.setPage(pageNumber);
    },
    [highlightPin, tableApiRef]
  );

  // will highlight the pin, center on it and select the row in the table
  const onRowSelection = useCallback(
    (rows: GridRowSelectionModel) => {
      const selectedId = rows[0] as string;
      highlightPin(selectedId);
      const selectedDemand = filteredDemands.find((demand) => demand.id === selectedId);
      // update the view after the pin has been highlighted
      if (selectedDemand) {
        setMapCenterLocation({
          center: [selectedDemand.Longitude, selectedDemand.Latitude],
          zoom: 16,
        });
      }
    },
    [highlightPin, filteredDemands, mapRef]
  );

  const onFilterUpdate = useCallback(
    (demands: Demand[]) => {
      setFilteredDemands(demands);
      if (tableApiRef.current?.setPage) {
        tableApiRef.current.setPage(0);
      }
    },
    [demands]
  );

  const updateDemand = useCallback(
    async (demandId: string, demandUpdate: Partial<Demand>) => {
      const updatedDemand = await demandsService.update(demandId, demandUpdate);
      if (updatedDemand) {
        const existingDemand = demands.find((d) => d.id === demandId);
        if (existingDemand) {
          // on mute directement l'objet et on ne recrée pas un nouveau tableau demands pour ne pas réinitialiser la pagination de la datagrid
          // les anciennes propriétés doivent être supprimées car l'API Airtable ne renvoie pas les propriétés vides
          Object.keys(existingDemand).forEach((key) => {
            delete existingDemand[key as keyof Demand];
          });
          Object.assign(existingDemand, updatedDemand);
          setDemands(demands);
        }
      }
    },
    [demands, demandsService]
  );

  const refreshMapPins = useCallback(() => {
    const addressList = filteredDemands.map<MapMarkerInfos>((demand) => ({
      id: demand.id,
      latitude: demand.Latitude,
      longitude: demand.Longitude,
      popup: true,
      popupContent: demand.Adresse,
      onClickAction: onMapPinClick,
    }));
    setMapPins(addressList);

    // center on first demand
    if (addressList[0]) {
      setMapCenterLocation({
        center: [addressList[0].longitude, addressList[0].latitude],
        zoom: 8,
      });
    }
  }, [filteredDemands]);

  useEffect(() => {
    refreshMapPins();
  }, [filteredDemands, refreshMapPins]);

  const demandRowsParams: ColumnDef<Demand>[] = useMemo(
    () => [
      {
        field: 'Statut',
        width: 300,
        sortable: false,
        renderCell: (params) => <Status demand={params.row} updateDemand={updateDemand} />,
        headerName: 'Statut',
      },
      {
        field: 'Prospect recontacté',
        sortable: false,
        align: 'center',
        renderCell: (params) => <Contacted demand={params.row} updateDemand={updateDemand} />,
        headerName: 'Prospect recontacté',
      },
      {
        field: 'Contact / Envoi de mails',
        headerName: 'Contact',
        minWidth: 280,
        sortable: false,
        renderCell: (params) => <Contact demand={params.row} updateDemand={updateDemand} />,
      },
      {
        field: 'Adresse',
        renderHeader: () => (
          <ColHeader>
            Adresse
            <HoverableIcon iconName="ri-information-fill" position="bottom-centered" iconSize="sm" top="0px">
              La mention “PDP" est indiquée pour les adresses situées dans le périmètre de développement prioritaire d’un réseau classé
              (connu par France Chaleur Urbaine).
            </HoverableIcon>
          </ColHeader>
        ),
        width: 320,
        sortable: false,
        renderCell: ({ row: demand }) => (
          <Box textWrap="pretty">
            {demand.Adresse}
            {demand['en PDP'] === 'Oui' && <Tag text="PDP" />}
          </Box>
        ),
      },
      {
        field: 'Date demandes',
        sortable: true,
        headerName: 'Date de la demande',
        renderCell: (params) => new Date(params.row['Date demandes']).toLocaleDateString(),
      },
      {
        field: 'Type de chauffage',
        sortable: false,
        width: 120,
        headerName: 'Type',
        renderCell: (params) => <Tag text={params.row.Structure} />,
      },
      {
        field: 'Mode de chauffage',
        sortable: false,
        width: 130,
        headerName: 'Mode de chauffage',
        renderCell: (params) => <Tag text={displayModeDeChauffage(params.row)} />,
      },
      {
        field: 'Distance au réseau',
        width: 120,
        renderHeader: () => (
          <ColHeader>
            Distance au réseau (m)
            <HoverableIcon iconName="ri-information-fill" position="bottom-centered" iconSize="sm" top="0px">
              Distance à vol d'oiseau
            </HoverableIcon>
          </ColHeader>
        ),
        renderCell: (params) => (
          <AdditionalInformation demand={params.row} field="Distance au réseau" updateDemand={updateDemand} type="number" />
        ),
      },
      {
        field: 'Identifiant réseau',
        width: 80,
        sortable: false,
        headerName: 'ID réseau le plus proche',
      },
      {
        field: 'Nom réseau',
        width: 250,
        sortable: false,
        headerName: 'Nom du réseau le plus proche',
        renderCell: ({ row }) => <Box textWrap="pretty">{row['Nom réseau']}</Box>,
      },
      {
        field: 'Nb logements',
        sortable: false,
        width: 120,
        headerName: 'Nb logements (lots)',
        renderCell: (params) => <AdditionalInformation demand={params.row} field="Logement" updateDemand={updateDemand} type="number" />,
      },
      {
        field: 'Surface en m2',
        sortable: false,
        width: 120,
        headerName: 'Surface en m2',
        renderCell: (params) => (
          <AdditionalInformation demand={params.row} field="Surface en m2" updateDemand={updateDemand} type="number" />
        ),
      },
      {
        field: 'Conso gaz',
        sortable: false,
        width: 120,
        headerName: 'Conso gaz (MWh)',
        renderCell: (params) => <AdditionalInformation demand={params.row} field="Conso" updateDemand={updateDemand} type="number" />,
      },
      {
        field: 'Commentaires',
        sortable: false,
        width: 280,
        headerName: 'Commentaires',
        renderCell: (params) => <Comment demand={params.row} updateDemand={updateDemand} />,
      },
      {
        field: 'Affecté à',
        sortable: false,
        width: 150,
        renderHeader: () => (
          <ColHeader>
            Affecté à
            <HoverableIcon iconName="ri-information-fill" position="left" iconSize="sm" top="0px">
              "Non affecté" : demande éloignée du réseau non transmise aux opérateurs
              <br />
              <br />
              Vous pouvez ajouter ou modifier une affectation : le changement sera effectif après validation manuelle par l'équipe FCU.
            </HoverableIcon>
          </ColHeader>
        ),
        renderCell: (params) => (
          <AdditionalInformation demand={params.row} field="Affecté à" updateDemand={updateDemand} type="text" width={125} />
        ),
      },
    ],
    [updateDemand]
  );

  return (
    <Container>
      <ManagerHeader demands={demands} setFilteredDemands={onFilterUpdate} />
      {demands.length > 0 ? (
        <ManagerContainer>
          <TableContainer mapCollapsed={mapCollapsed}>
            {filteredDemands.length > 0 ? (
              <Table
                apiRef={tableApiRef}
                columns={demandRowsParams}
                rows={filteredDemands}
                disableColumnMenu
                columnHeaderHeight={100}
                autoHeight
                getRowHeight={() => 'auto'}
                onRowSelectionModelChange={onRowSelection}
                hideFooterSelectedRowCount
                initialState={{
                  sorting: {
                    sortModel: [{ field: 'Date demandes', sort: 'desc' }],
                  },
                }}
              />
            ) : (
              <NoResult>Aucun résultat</NoResult>
            )}
          </TableContainer>
          <MapContainer mapCollapsed={mapCollapsed}>
            <>
              <CollapseMap mapCollapsed={mapCollapsed} onClick={() => setMapCollapsed(!mapCollapsed)}>
                <Hoverable position="left">{mapCollapsed ? 'Agrandir la carte' : 'Réduire la carte'}</Hoverable>
                <Icon size="lg" name={mapCollapsed ? 'ri-arrow-left-s-fill' : 'ri-arrow-right-s-fill'} />
              </CollapseMap>
              {!mapCollapsed && (
                <Map
                  noPopup
                  withoutLogo
                  initialCenter={mapCenterLocation?.center}
                  initialZoom={mapCenterLocation?.zoom}
                  initialMapConfiguration={createMapConfiguration({
                    reseauxDeChaleur: {
                      show: true,
                    },
                    reseauxEnConstruction: true,
                    zonesDeDeveloppementPrioritaire: true,
                  })}
                  pinsList={mapPins}
                  geolocDisabled
                  mapRef={mapRef}
                />
              )}
            </>
          </MapContainer>
        </ManagerContainer>
      ) : (
        <h2>{loading ? 'Chargement de vos données en cours...' : "Vous n'avez pas encore reçu de demandes"}</h2>
      )}
    </Container>
  );
};

export default Manager;
