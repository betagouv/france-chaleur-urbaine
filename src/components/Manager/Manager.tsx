import Hoverable from '@components//Hoverable';
import HoverableIcon from '@components/Hoverable/HoverableIcon';
import Map from '@components/Map/Map';
import { Icon, Table } from '@dataesr/react-dsfr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useServices } from 'src/services';
import { displayModeDeChauffage } from 'src/services/Map/businessRules/demands';
import { RowsParams } from 'src/services/demands';
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
  const [sort, setSort] = useState<SortParamType>(defaultSort);
  const refManagerTable: null | { current: any } = useRef(null);
  const [centerRow, setCenterRow] = useState<string>();

  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [mapPins, setMapPins] = useState<MapMarkerInfos[]>([]);
  const [centerPin, setCenterPin] = useState<[number, number]>();
  const [firstCenterPin, setFirstCenterPin] = useState<[number, number]>();
  const [initialZoom, setInitialZoom] = useState<number>(8);

  const handleSort = useCallback(
    (key: keyof Demand, backupKey?: keyof Demand) => () => {
      const order =
        sort.key !== key || !sort.order
          ? 'desc'
          : sort.order === 'desc'
          ? 'asc'
          : undefined;
      setSort(order ? { key, backupKey, order } : defaultSort);
    },
    [sort]
  );

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
    (demandId: string, demand: Partial<Demand>) => {
      demandsService.update(demandId, demand).then((response) => {
        if (response) {
          const index = demands.findIndex((d) => d.id === demandId);
          demands.splice(index, 1, response);
          setDemands([...demands]);
        }
      });
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
      name: 'Contact / Envoi de mails',
      label: 'Contact',
      render: (demand) => (
        <Contact demand={demand} updateDemand={updateDemand} />
      ),
    },
    {
      name: 'Adresse',
      label: (
        <>
          Adresse
          <HoverableIcon
            iconName="ri-information-fill"
            position="bottom"
            iconSize="lg"
          >
            La mention “PDP" est indiquée pour les adresses situées dans le
            périmètre de développement prioritaire d’un réseau classé (connu par
            France Chaleur Urbaine).
          </HoverableIcon>
        </>
      ),
      render: (demand) => <Addresse demand={demand} />,
    },
    {
      name: 'Date demandes',
      label: (
        <ColHeader
          sort={sort.key === 'Date demandes' ? sort.order : undefined}
          onClick={handleSort('Date demandes')}
          width="100px"
        >
          Date de la demande
        </ColHeader>
      ),

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
      render: (demand) => <Tag text={displayModeDeChauffage(demand)} />,
    },
    {
      name: 'Distance au réseau',
      label: (
        <ColHeader
          sort={
            sort.key === 'Gestionnaire Distance au réseau'
              ? sort.order
              : undefined
          }
          onClick={handleSort(
            'Gestionnaire Distance au réseau',
            'Distance au réseau'
          )}
        >
          Distance au réseau (m)
          <HoverableIcon
            iconName="ri-information-fill"
            position="bottom-centered"
            iconSize="lg"
          >
            Distance à vol d'oiseau
          </HoverableIcon>
        </ColHeader>
      ),
      render: (demand) => (
        <AdditionalInformation
          demand={demand}
          field="Distance au réseau"
          updateDemand={updateDemand}
          type="number"
        />
      ),
    },
    { name: 'Identifiant réseau', label: 'ID réseau le plus proche' },
    { name: 'Nom réseau', label: 'Nom du réseau le plus proche' },
    {
      name: 'Nb logements',
      label: 'Nb logements (lots)',
      render: (demand) => (
        <AdditionalInformation
          demand={demand}
          field="Logement"
          updateDemand={updateDemand}
          type="number"
        />
      ),
    },
    {
      name: 'Conso gaz',
      label: 'Conso gaz (MWh)',
      render: (demand) => (
        <AdditionalInformation
          demand={demand}
          field="Conso"
          updateDemand={updateDemand}
          type="number"
        />
      ),
    },
    {
      name: 'Commentaires',
      label: 'Commentaires',
      render: (demand) => (
        <Comment demand={demand} updateDemand={updateDemand} />
      ),
    },
    {
      name: 'Affecté à',
      label: (
        <>
          Affecté à
          <HoverableIcon
            iconName="ri-information-fill"
            position="bottom"
            iconSize="lg"
          >
            "Non affecté" : demande éloignée du réseau non transmise aux
            opérateurs
            <br />
            <br />
            Vous pouvez ajouter ou modifier une affectation : le changement sera
            effectif après validation manuelle par l'équipe FCU.
          </HoverableIcon>
        </>
      ),
      render: (demand) => (
        <AdditionalInformation
          demand={demand}
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
                <Table
                  columns={demandRowsParams}
                  data={filteredDemands}
                  rowKey="N° de dossier"
                  pagination
                  paginationPosition="left"
                  page={page}
                  setPage={setPage}
                  perPage={rowPerPage}
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
                  size="2x"
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
