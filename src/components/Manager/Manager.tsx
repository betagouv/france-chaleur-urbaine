import Hoverable from '@components//Hoverable';
import Icon from '@components/ui/Icon';
import Map from '@components/Map/Map';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useServices } from 'src/services';
import { displayModeDeChauffage } from 'src/services/Map/businessRules/demands';
import { Demand } from 'src/types/Summary/Demand';
import AdditionalInformation from './AdditionalInformation';
import Addresse from './Addresse';
import Comment from './Comment';
import Contact from './Contact';
import Contacted from './Contacted';
import {
  ColHeader,
  CollapseMap,
  Container,
  ManagerContainer,
  MapContainer,
  NoResult,
  TableContainer,
} from './Manager.styles';
import ManagerHeader from './ManagerHeader';
import Status from './Status';
import Tag from './Tag';
import { MapMarkerInfos } from 'src/types/MapComponentsInfos';
import { createMapConfiguration } from 'src/services/Map/map-configuration';

const rowPerPage: number = 10;

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
  const [isFirstInit, setIsFirstInit] = useState<boolean>(true);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);
  const [sort] = useState<SortParamType>(defaultSort); //setSort
  const refManagerTable: null | { current: any } = useRef(null);
  const [centerRow, setCenterRow] = useState<string>();

  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [mapPins, setMapPins] = useState<MapMarkerInfos[]>([]);
  const [centerPin, setCenterPin] = useState<[number, number]>();
  const [firstCenterPin, setFirstCenterPin] = useState<[number, number]>();
  const [initialZoom, setInitialZoom] = useState<number>(8);

  const setMapCenter = (pin: [number, number]) => {
    setCenterPin(pin);
    setInitialZoom(16);
  };

  const highlightPin = useCallback((id: string) => {
    setMapPins((currentMapPins) => {
      const newMapPins: MapMarkerInfos[] = currentMapPins;
      newMapPins.map((pin: MapMarkerInfos) => {
        if (pin.id == id) {
          pin.color = 'red';
          setMapCenter([pin.longitude, pin.latitude]);
        } else if (pin.color != '#4550e5') {
          pin.color = '#4550e5';
        }
      });
      return newMapPins;
    });
  }, []);

  const highlightRow = useCallback(
    (id: string) => {
      if (refManagerTable.current) {
        const rows: NodeList =
          refManagerTable.current.querySelectorAll('tbody tr');
        if (rows && rows.length > 0) {
          let matchingRow: any | undefined;
          rows.forEach((row: any) => {
            row.style.removeProperty('background-color');
            if (Object.values(row as Node)[0].key) {
              const fileNumber = Object.values(row as Node)[0].key;
              if (id == fileNumber) {
                matchingRow = row;
                return;
              }
            }
          });
          if (matchingRow) {
            matchingRow.style.backgroundColor = '#cfcfcf';
          } else {
            //Highlight in another page
            for (let i = 0; i < filteredDemands.length; i += 1) {
              if (
                filteredDemands[i] &&
                id == filteredDemands[i]['N° de dossier']
              ) {
                const newPage = Math.floor(i / rowPerPage) + 1;
                setCenterRow(id);
                setPage(newPage);
                break;
              }
            }
          }
        }
      }
    },
    [filteredDemands]
  );

  const highlight = useCallback(
    (id: string) => {
      highlightPin(id);
      highlightRow(id);
    },
    [highlightPin, highlightRow]
  );

  const addOnClick = useCallback(() => {
    if (refManagerTable.current) {
      const rows = refManagerTable.current.querySelectorAll('tbody tr');
      if (rows && rows.length > 0) {
        rows.forEach((row: Node) => {
          if (Object.values(row)[0].key) {
            const fileNumber = Object.values(row)[0].key;
            const matchingDemand: any | undefined = demands.find(
              (demand: any) => {
                if (demand['N° de dossier'] == fileNumber) return demand;
              }
            );
            if (matchingDemand) {
              row.addEventListener('click', () => {
                highlight(matchingDemand['N° de dossier']);
              });
            }
          }
        });
        setIsFirstInit(false);
      }
    }
  }, [demands, highlight]);

  const onUpdateMapPins = useCallback(() => {
    const addressList: MapMarkerInfos[] = [];
    let firstDemand: any;
    if (filteredDemands) {
      filteredDemands.forEach((demand: any) => {
        if (demand.Latitude && demand.Longitude) {
          !firstDemand && (firstDemand = demand);
          addressList.push({
            id: demand['N° de dossier'],
            latitude: demand.Latitude,
            longitude: demand.Longitude,
            popup: true,
            popupContent: demand.Adresse,
            onClickAction: highlight,
          });
        }
      });
    }
    setMapPins(addressList);
    if (isFirstInit) {
      addOnClick();
      if (firstDemand) {
        setFirstCenterPin([firstDemand.Longitude, firstDemand.Latitude]);
      }
    }
  }, [filteredDemands, isFirstInit, highlight, addOnClick]);

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
    async (demandId: string, demand: Partial<Demand>) => {
      const updatedDemand = await demandsService.update(demandId, demand);
      if (updatedDemand) {
        const index = demands.findIndex((d) => d.id === demandId);
        demands.splice(index, 1, updatedDemand);
        setDemands([...demands]);
      }
    },
    [demands, demandsService]
  );

  useEffect(() => {
    if (filteredDemands && filteredDemands.length > 0) {
      onUpdateMapPins();
    }
  }, [filteredDemands, onUpdateMapPins]);

  useEffect(() => {
    if (centerRow) {
      highlight(centerRow);
    }
  }, [highlight, centerRow]);

  useEffect(() => {
    addOnClick();
  }, [addOnClick, page]);

  const demandRowsParams: GridColDef[] = [
    {
      field: 'Statut',
      width: 300,
      renderCell: (params) => (
        <Status demand={params.row} updateDemand={updateDemand} />
      ),
      renderHeader: () => <ColHeader>Statut</ColHeader>,
    },
    {
      field: 'Prospect recontacté',
      width: 90,
      align: 'center',
      renderCell: (params) => (
        <Contacted demand={params.row} updateDemand={updateDemand} />
      ),
      renderHeader: () => <ColHeader>Prospect recontacté</ColHeader>,
    },
    {
      field: 'Contact / Envoi de mails',
      headerName: 'Contact',
      width: 250,
      renderCell: (params) => (
        <Contact demand={params.row} updateDemand={updateDemand} />
      ),
    },
    {
      field: 'Adresse',
      renderHeader: () => <ColHeader>Adresse</ColHeader>,
      width: 250,
      renderCell: (params) => <Addresse demand={params.row} />,
    },
    {
      field: 'Date demandes',
      renderHeader: () => <ColHeader>Date de la demande</ColHeader>,
      renderCell: (params) =>
        new Date(params.row['Date demandes']).toLocaleDateString(),
    },
    {
      field: 'Type de chauffage',
      renderHeader: () => <ColHeader>Type</ColHeader>,
      renderCell: (params) => <Tag text={params.row.Structure} />,
    },
    {
      field: 'Mode de chauffage',
      renderHeader: () => <ColHeader>Mode de chauffage</ColHeader>,
      renderCell: (params) => <Tag text={displayModeDeChauffage(params.row)} />,
    },
    {
      field: 'Distance au réseau',
      renderHeader: () => <ColHeader>Distance au réseau (m)</ColHeader>,
      renderCell: (params) => (
        <AdditionalInformation
          demand={params.row}
          field="Distance au réseau"
          updateDemand={updateDemand}
          type="number"
        />
      ),
    },
    {
      field: 'Identifiant réseau',
      renderHeader: () => <ColHeader>ID réseau le plus proche</ColHeader>,
    },
    {
      field: 'Nom réseau',
      width: 250,
      renderHeader: () => <ColHeader>Nom du réseau le plus proche</ColHeader>,
    },
    {
      field: 'Nb logements',
      renderHeader: () => <ColHeader>Nb logements (lots)</ColHeader>,
      renderCell: (params) => (
        <AdditionalInformation
          demand={params.row}
          field="Logement"
          updateDemand={updateDemand}
          type="number"
        />
      ),
    },
    {
      field: 'Conso gaz',
      renderHeader: () => <ColHeader>Conso gaz (MWh)</ColHeader>,
      renderCell: (params) => (
        <AdditionalInformation
          demand={params.row}
          field="Conso"
          updateDemand={updateDemand}
          type="number"
        />
      ),
    },
    {
      field: 'Commentaires',
      width: 280,
      renderHeader: () => <ColHeader>Commentaires</ColHeader>,
      renderCell: (params) => (
        <Comment demand={params.row} updateDemand={updateDemand} />
      ),
    },
    {
      field: 'Affecté à',
      renderHeader: () => <ColHeader>Affecté à</ColHeader>,
      renderCell: (params) => (
        <AdditionalInformation
          demand={params.row}
          field="Affecté à"
          updateDemand={updateDemand}
          type="text"
          width={125}
        />
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
        <ManagerContainer>
          <TableContainer mapCollapsed={mapCollapsed}>
            <div ref={refManagerTable}>
              {filteredDemands.length > 0 ? (
                <DataGrid
                  columns={demandRowsParams}
                  rows={filteredDemands}
                  pageSizeOptions={[10, 100, { value: 1000, label: '1,000' }]}
                  getRowHeight={() => 'auto'}
                  getEstimatedRowHeight={() => 110}
                  sx={{
                    '& .MuiDataGrid-cell ': {
                      display: 'flex',
                      'align-items': 'center',
                    },
                    '& .MuiDataGrid-columnHeaders div[role=row]': {
                      bgcolor: '#F0EFE8',
                      'border-bottom': '1px solid #333333',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      'border-bottom': '1px solid #333333',
                    },
                  }}
                />
              ) : (
                <NoResult>Aucun résultat</NoResult>
              )}
            </div>
          </TableContainer>
          <MapContainer mapCollapsed={mapCollapsed}>
            <>
              <CollapseMap
                mapCollapsed={mapCollapsed}
                onClick={() => setMapCollapsed(!mapCollapsed)}
              >
                <Hoverable position="left">
                  {mapCollapsed ? 'Agrandir la carte' : 'Réduire la carte'}
                </Hoverable>
                <Icon
                  size="lg"
                  name={
                    mapCollapsed
                      ? 'ri-arrow-left-s-fill'
                      : 'ri-arrow-right-s-fill'
                  }
                />
              </CollapseMap>
              {!mapCollapsed && (
                <Map
                  noPopup
                  withoutLogo
                  initialCenter={centerPin ? centerPin : firstCenterPin}
                  initialZoom={initialZoom}
                  initialMapConfiguration={createMapConfiguration({
                    reseauxDeChaleur: {
                      show: true,
                    },
                    reseauxEnConstruction: true,
                    zonesDeDeveloppementPrioritaire: true,
                  })}
                  pinsList={mapPins}
                  geolocDisabled
                />
              )}
            </>
          </MapContainer>
        </ManagerContainer>
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
