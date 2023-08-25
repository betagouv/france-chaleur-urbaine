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
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);
  const [sort, setSort] = useState<SortParamType>(defaultSort);
  const refManagerTable: null | { current: any } = useRef(null);
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [mapPins, setMapPins] = useState<MapMarkerInfos[]>([]);
  const [centerPin, setCenterPin] = useState<[number, number]>();

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

  const onCenterPin = useCallback((demand: any) => {
    setCenterPin([demand.Longitude, demand.Latitude]);
  }, []);

  const onClickMap = useCallback((id: string) => {
    if (refManagerTable.current) {
      const rows: NodeList = refManagerTable.current.querySelectorAll('tr');
      if (rows && rows.length > 0) {
        let matchingRow: any | undefined;
        rows.forEach((row: any) => {
          row.style.backgroundColor = 'unset';
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
        }
      }
    }
  }, []);

  const onUpdateMapPins = useCallback(() => {
    if (refManagerTable.current) {
      const addressList: MapMarkerInfos[] = [];
      const rows = refManagerTable.current.querySelectorAll('tr');
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
              addressList.push({
                id: fileNumber,
                latitude: matchingDemand.Latitude,
                longitude: matchingDemand.Longitude,
                popup: true,
                popupContent: matchingDemand.Adresse,
                onClickAction: onClickMap,
              });
              row.addEventListener('click', () => {
                onCenterPin(matchingDemand);
              });
            }
          }
        });
      }
      setMapPins(addressList);
    }
  }, [demands, onCenterPin, onClickMap]);

  const onFilterUpdate = useCallback(
    (demands: Demand[]) => {
      const sortedDemands = getSortBy(demands)(sort);
      setFilteredDemands(sortedDemands);
      onUpdateMapPins();
    },
    [sort, onUpdateMapPins]
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
    //TODO à changer - pas une bonne pratique
    if (refManagerTable.current) {
      onUpdateMapPins();
    }
  }, [onUpdateMapPins, refManagerTable.current]);

  useEffect(() => {
    onUpdateMapPins();
  }, [onUpdateMapPins, page]);

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
      name: 'Contact',
      label: 'Contact',
      render: (demand) => <Contact demand={demand} />,
    },
    {
      name: 'Adresse',
      label: 'Adresse',
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
                  center={centerPin ? centerPin : undefined}
                  initialLayerDisplay={{
                    outline: true,
                    futurOutline: true,
                    coldOutline: false,
                    zoneDP: true,
                    demands: false,
                    raccordements: false,
                    gasUsageGroup: false,
                    buildings: false,
                    gasUsage: [],
                    energy: [],
                    gasUsageValues: [1000, Number.MAX_VALUE],
                    energyGasValues: [50, Number.MAX_VALUE],
                    energyFuelValues: [50, Number.MAX_VALUE],
                  }}
                  pinsList={mapPins}
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
