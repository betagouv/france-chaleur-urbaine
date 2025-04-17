import { useCallback, useMemo, useRef, useState } from 'react';
import { type RefObject } from 'react';
import { type MapRef } from 'react-map-gl/maplibre';

import HoverableIcon from '@/components/Hoverable/HoverableIcon';
import AdditionalInformation from '@/components/Manager/AdditionalInformation';
import Comment from '@/components/Manager/Comment';
import Contact from '@/components/Manager/Contact';
import Contacted from '@/components/Manager/Contacted';
import Status from '@/components/Manager/Status';
import Tag from '@/components/Manager/Tag';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import Icon from '@/components/ui/Icon';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useFetch } from '@/hooks/useApi';
import { withAuthentication } from '@/server/authentication';
import { type MapMarkerInfos } from '@/types/MapComponentsInfos';
import { type Point } from '@/types/Point';
import { type Demand } from '@/types/Summary/Demand';
import { isDefined } from '@/utils/core';

type MapCenterLocation = {
  center: Point;
  zoom: number;
};

// Utility functions
const displayModeDeChauffage = (demand: Demand) => {
  if (
    demand['Mode de chauffage'] &&
    (demand['Mode de chauffage'].toLowerCase().trim() === 'gaz' ||
      demand['Mode de chauffage'].toLowerCase().trim() === 'fioul' ||
      demand['Mode de chauffage'].toLowerCase() === 'électricité')
  ) {
    return `${demand['Mode de chauffage'][0].toUpperCase()}${demand['Mode de chauffage'].slice(1).trim()} ${
      demand['Type de chauffage'] ? demand['Type de chauffage'].toLowerCase() : ''
    }`;
  }
  return demand['Type de chauffage'];
};

function DemandesNew(): React.ReactElement {
  const mapRef = useRef<MapRef>(null) as RefObject<MapRef>;

  const [selectedRows, setSelectedRows] = useState<Demand[]>([]);

  const [mapCollapsed, setMapCollapsed] = useState(false);
  // const [mapPins, setMapPins] = useState<MapMarkerInfos[]>([]);
  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();

  const { data: demands = [], isLoading } = useFetch<Demand[]>('/api/demands');

  // useEffect(() => {
  //   const addressList = filteredDemands.map<MapMarkerInfos>((demand) => ({
  //     id: demand.id,
  //     latitude: demand.Latitude,
  //     longitude: demand.Longitude,
  //     popup: true,
  //     popupContent: demand.Adresse,
  //     onClickAction: onMapPinClick,
  //     color: selectedRows.some((row) => row.id === demand.id) ? 'red' : '#4550e5',
  //   }));
  //   setMapPins(addressList);

  //   // center on first demand
  //   if (addressList[0]) {
  //     setMapCenterLocation({
  //       center: [addressList[0].longitude, addressList[0].latitude],
  //       zoom: 8,
  //     });
  //   }
  // }, [filteredDemands, selectedRows]);

  // Update map when filtered demands change
  const mapPins = useMemo(() => {
    const pins = demands.map<MapMarkerInfos>((demand) => ({
      id: demand.id,
      latitude: demand.Latitude,
      longitude: demand.Longitude,
      popup: true,
      popupContent: demand.Adresse,
      // onClickAction: onMapPinClick,
      color: selectedRows.some((row) => row.id === demand.id) ? 'red' : '#4550e5',
    }));

    // center on first demand
    if (pins[0]) {
      setMapCenterLocation({
        center: [pins[0].longitude, pins[0].latitude],
        zoom: 8,
      });
    }

    return pins;
  }, [demands, selectedRows]);

  // Map interaction
  // const highlightPin = useCallback(
  //   (selectedPinId: string) => {
  //     setMapPins((currentMapPins) => [
  //       ...currentMapPins.map((pin) => ({
  //         ...pin,
  //         color: pin.id === selectedPinId ? 'red' : '#4550e5',
  //       })),
  //     ]);
  //   },
  //   [setMapPins]
  // );

  // const onMapPinClick = useCallback(
  //   (demandId: string) => {
  //     const selectedDemand = filteredDemands.find((demand) => demand.id === demandId);
  //     if (selectedDemand) {
  //       setSelectedRows([selectedDemand]);
  //       highlightPin(demandId);

  //       // Find page that contains this demand and navigate to it
  //       const demandIndex = filteredDemands.findIndex((d) => d.id === demandId);
  //       if (demandIndex !== -1) {
  //         const demandPage = Math.floor(demandIndex / itemsPerPage) + 1;
  //         setCurrentPage(demandPage);
  //       }

  //       // Center map on the selected demand
  //       setMapCenterLocation({
  //         center: [selectedDemand.Longitude, selectedDemand.Latitude],
  //         zoom: 16,
  //       });
  //     }
  //   },
  //   [filteredDemands, highlightPin, itemsPerPage]
  // );

  // const updateDemand = useCallback(
  //   async (demandId: string, demandUpdate: Partial<Demand>) => {
  //     const updatedDemand = await demandsService.update(demandId, demandUpdate);
  //     if (updatedDemand) {
  //       const existingDemand = demands.find((d) => d.id === demandId);
  //       if (existingDemand) {
  //         // Update existing demand directly
  //         Object.keys(existingDemand).forEach((key) => {
  //           delete existingDemand[key as keyof Demand];
  //         });
  //         Object.assign(existingDemand, updatedDemand);
  //         setDemands([...demands]);
  //       }
  //     }
  //   },
  //   [demands, demandsService]
  // );

  const updateDemand = useCallback(async (demandId: string, demandUpdate: Partial<Demand>) => {
    console.log('FIXME updateDemand', demandId, demandUpdate);
  }, []);

  // TableSimple column definitions
  const columns: ColumnDef<Demand>[] = [
    {
      accessorKey: 'Statut',
      header: 'Statut',
      cell: ({ row }) => <Status demand={row.original} updateDemand={updateDemand} />,
      width: '300px',
    },
    {
      accessorKey: 'Prospect recontacté',
      header: 'Prospect recontacté',
      cell: ({ row }) => <Contacted demand={row.original} updateDemand={updateDemand} />,
      align: 'center',
    },
    {
      accessorKey: 'Contact / Envoi de mails',
      header: 'Contact',
      cell: ({ row }) => <Contact demand={row.original} updateDemand={updateDemand} />,
      width: '280px',
    },
    {
      accessorKey: 'Adresse',
      header: () => (
        <div className="flex items-center">
          Adresse
          <HoverableIcon iconName="ri-information-fill" position="bottom-centered" iconSize="sm" top="0px">
            La mention "PDP" est indiquée pour les adresses situées dans le périmètre de développement prioritaire d'un réseau classé (connu
            par France Chaleur Urbaine).
          </HoverableIcon>
        </div>
      ),
      cell: ({ row }) => (
        <div className="whitespace-normal">
          {row.original.Adresse}
          {row.original['en PDP'] === 'Oui' && <Tag text="PDP" />}
        </div>
      ),
      width: '320px',
    },
    {
      accessorKey: 'Date demandes',
      header: 'Date de la demande',
      cell: ({ row }) => new Date(row.original['Date demandes']).toLocaleDateString(),
      sorting: 'nullsLast',
    },
    {
      accessorKey: 'Type de chauffage',
      header: 'Type',
      cell: ({ row }) => <Tag text={row.original.Structure} />,
      width: '120px',
    },
    {
      accessorKey: 'Mode de chauffage',
      header: 'Mode de chauffage',
      cell: ({ row }) => <Tag text={displayModeDeChauffage(row.original)} />,
      width: '130px',
    },
    {
      accessorKey: 'Distance au réseau',
      header: () => (
        <div className="flex items-center">
          Distance au réseau (m)
          <HoverableIcon iconName="ri-information-fill" position="bottom-centered" iconSize="sm" top="0px">
            Distance à vol d'oiseau
          </HoverableIcon>
        </div>
      ),
      cell: ({ row }) => (
        <AdditionalInformation demand={row.original} field="Distance au réseau" updateDemand={updateDemand} type="number" />
      ),
      width: '120px',
    },
    {
      accessorKey: 'Identifiant réseau',
      header: 'ID réseau le plus proche',
      width: '80px',
    },
    {
      accessorKey: 'Nom réseau',
      header: 'Nom du réseau le plus proche',
      cell: ({ row }) => <div className="whitespace-normal">{row.original['Nom réseau']}</div>,
      width: '250px',
    },
    {
      accessorKey: 'Nb logements',
      header: 'Nb logements (lots)',
      cell: ({ row }) => <AdditionalInformation demand={row.original} field="Logement" updateDemand={updateDemand} type="number" />,
      width: '120px',
    },
    {
      accessorKey: 'Surface en m2',
      header: 'Surface en m2',
      cell: ({ row }) => <AdditionalInformation demand={row.original} field="Surface en m2" updateDemand={updateDemand} type="number" />,
      width: '120px',
    },
    {
      accessorKey: 'Conso gaz',
      header: 'Conso gaz (MWh)',
      cell: ({ row }) => <AdditionalInformation demand={row.original} field="Conso" updateDemand={updateDemand} type="number" />,
      width: '120px',
    },
    {
      accessorKey: 'Commentaires',
      header: 'Commentaires',
      cell: ({ row }) => <Comment demand={row.original} updateDemand={updateDemand} />,
      width: '280px',
    },
    {
      accessorKey: 'Affecté à',
      header: () => (
        <div className="flex items-center">
          Affecté à
          <HoverableIcon iconName="ri-information-fill" position="left" iconSize="sm" top="0px">
            "Non affecté" : demande éloignée du réseau non transmise aux opérateurs
            <br />
            <br />
            Vous pouvez ajouter ou modifier une affectation : le changement sera effectif après validation manuelle par l'équipe FCU.
          </HoverableIcon>
        </div>
      ),
      cell: ({ row }) => (
        <AdditionalInformation demand={row.original} field="Affecté à" updateDemand={updateDemand} type="text" width={125} />
      ),
      width: '150px',
    },
  ];
  console.log('render demandes-new');
  return (
    <SimplePage
      title="Suivi des demandes"
      description="Votre tableau de bord pour la gestion des demandes des réseaux de chaleur"
      mode="authenticated"
    >
      <div className="mb-8">
        {demands.length > 0 && isDefined(mapCenterLocation) ? (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className={`${mapCollapsed ? 'lg:col-span-5' : 'lg:col-span-3'} overflow-auto`}>
              {/* <TableSimple
                columns={columns}
                data={demands}
                loading={isLoading}
                fluid={true}
                enableRowSelection={true}
                controlsLayout="block"
                onSelectionChange={(selectedRows) => {
                  setSelectedRows(selectedRows);
                  if (selectedRows.length === 1) {
                    const selectedDemand = selectedRows[0];
                    // highlightPin(selectedDemand.id);
                    setMapCenterLocation({
                      center: [selectedDemand.Longitude, selectedDemand.Latitude],
                      zoom: 16,
                    });
                  }
                }}
                initialSortingState={[{ id: 'Date demandes', desc: true }]}
              /> */}
            </div>

            {mapCollapsed ? (
              <div className="flex justify-end">
                <div
                  className="flex items-center gap-2 bg-white p-1 rounded-md cursor-pointer shadow-sm"
                  onClick={() => setMapCollapsed(false)}
                >
                  <div className="text-sm">Afficher la carte</div>
                  <Icon size="lg" name="ri-arrow-right-s-fill" />
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 relative">
                <div
                  className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-white p-1 rounded-md cursor-pointer shadow-sm"
                  onClick={() => setMapCollapsed(true)}
                >
                  <div className="text-sm">Masquer la carte</div>
                  <Icon size="lg" name="ri-arrow-left-s-fill" />
                </div>
                <div className="h-[600px]">
                  <Map
                    noPopup
                    withoutLogo
                    initialCenter={mapCenterLocation.center}
                    initialZoom={mapCenterLocation.zoom}
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
                </div>
              </div>
            )}
          </div>
        ) : (
          <h2 className="mt-8 text-center">
            {isLoading ? 'Chargement de vos données en cours...' : "Vous n'avez pas encore reçu de demandes"}
          </h2>
        )}
      </div>
    </SimplePage>
  );
}

export default DemandesNew;

export const getServerSideProps = withAuthentication(['gestionnaire', 'demo']);
