import { useQueryClient } from '@tanstack/react-query';
import { type ColumnFiltersState } from '@tanstack/react-table';
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { type RefObject } from 'react';
import { type MapRef } from 'react-map-gl/maplibre';

import AdditionalInformation from '@/components/Manager/AdditionalInformation';
import Comment from '@/components/Manager/Comment';
import Contact from '@/components/Manager/Contact';
import Contacted from '@/components/Manager/Contacted';
import DemandStatusBadge from '@/components/Manager/DemandStatusBadge';
import Status from '@/components/Manager/Status';
import Tag from '@/components/Manager/Tag';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/TableSimple';
import Tooltip from '@/components/ui/Tooltip';
import { useFetch } from '@/hooks/useApi';
import { withAuthentication } from '@/server/authentication';
import { type DemandStatus } from '@/types/enum/DemandSatus';
import { type MapMarkerInfos } from '@/types/MapComponentsInfos';
import { type Point } from '@/types/Point';
import { type Demand } from '@/types/Summary/Demand';
import { isDefined } from '@/utils/core';
import { putFetchJSON } from '@/utils/network';
import { upperCaseFirstChar } from '@/utils/strings';
import { ObjectEntries } from '@/utils/typescript';

type MapCenterLocation = {
  center: Point;
  zoom: number;
};

const displayModeDeChauffage = (demand: Demand) => {
  const modeDeChauffage = demand['Mode de chauffage']?.toLowerCase()?.trim();
  if (modeDeChauffage && ['gaz', 'fioul', 'électricité'].includes(modeDeChauffage)) {
    return `${upperCaseFirstChar(modeDeChauffage)} ${demand['Type de chauffage'] ? demand['Type de chauffage'].toLowerCase() : ''}`;
  }
  return demand['Type de chauffage'];
};

function getDemandsTableColumns(updateDemand: (demandId: string, demandUpdate: Partial<Demand>) => Promise<void>): ColumnDef<Demand>[] {
  return [
    {
      accessorKey: 'Status',
      header: 'Statut',
      cell: ({ row }) => <Status demand={row.original} updateDemand={updateDemand} />,
      width: '300px',
      filterType: 'Facets',
      filterProps: {
        Component: ({ value }) => <DemandStatusBadge status={value as DemandStatus} />,
      },
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
      enableSorting: false,
    },
    {
      accessorKey: 'Adresse',
      header: () => (
        <div className="flex items-center">
          Adresse
          <Tooltip
            iconProps={{
              className: 'ml-1',
              name: 'ri-information-fill',
              size: 'sm',
            }}
            title="La mention 'PDP' est indiquée pour les adresses situées dans le périmètre de développement prioritaire d'un réseau classé (connu par France Chaleur Urbaine)."
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="whitespace-normal">
          {row.original.Adresse}
          {row.original['en PDP'] === 'Oui' && <Tag text="PDP" />}
        </div>
      ),
      width: '320px',
      enableSorting: false,
    },
    {
      accessorKey: 'Date de la demande',
      header: 'Date de la demande',
      cellType: 'Date',
    },
    {
      accessorKey: 'Structure',
      header: 'Type',
      cell: ({ row }) => <Tag text={row.original.Structure} />,
      width: '120px',
      filterType: 'Facets',
    },
    {
      // accessorKey: 'Mode de chauffage',
      accessorFn: (row) => displayModeDeChauffage(row),
      header: 'Mode de chauffage',
      cell: ({ row }) => <Tag text={displayModeDeChauffage(row.original)} />,
      width: '130px',
      filterType: 'Facets',
    },
    {
      accessorKey: 'Distance au réseau',
      header: () => (
        <div className="flex items-center">
          Distance au réseau (m)
          <Tooltip
            iconProps={{
              className: 'ml-1',
              name: 'ri-information-fill',
              size: 'sm',
            }}
            title="Distance à vol d'oiseau"
          />
        </div>
      ),
      cell: ({ row }) => (
        <AdditionalInformation demand={row.original} field="Distance au réseau" updateDemand={updateDemand} type="number" />
      ),
      width: '120px',
      filterType: 'Range',
      filterProps: {
        domain: [0, 1000],
        unit: 'm',
      },
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
      accessorKey: 'Logement',
      header: 'Nb logements (lots)',
      cell: ({ row }) => <AdditionalInformation demand={row.original} field="Logement" updateDemand={updateDemand} type="number" />,
      width: '120px',
      filterType: 'Range',
      sorting: 'nullsLast',
    },
    {
      accessorKey: 'Surface en m2',
      header: 'Surface en m2',
      cell: ({ row }) => <AdditionalInformation demand={row.original} field="Surface en m2" updateDemand={updateDemand} type="number" />,
      width: '120px',
      filterType: 'Range',
      filterProps: {
        unit: 'm2',
      },
    },
    {
      accessorKey: 'Conso',
      header: 'Conso gaz (MWh)',
      cell: ({ row }) => <AdditionalInformation demand={row.original} field="Conso" updateDemand={updateDemand} type="number" />,
      width: '120px',
      filterType: 'Range',
      filterProps: {
        unit: 'MWh',
      },
    },
    {
      accessorKey: 'Commentaires',
      header: 'Commentaires',
      cell: ({ row }) => <Comment demand={row.original} updateDemand={updateDemand} />,
      width: '280px',
      enableSorting: false,
    },
    {
      accessorKey: 'Affecté à',
      header: () => (
        <div className="flex items-center">
          Affecté à
          <Tooltip
            iconProps={{
              className: 'ml-1',
              name: 'ri-information-fill',
              size: 'sm',
            }}
            title={
              <>
                "Non affecté" : demande éloignée du réseau non transmise aux opérateurs
                <br />
                <br />
                Vous pouvez ajouter ou modifier une affectation : le changement sera effectif après validation manuelle par l'équipe FCU.
              </>
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <AdditionalInformation demand={row.original} field="Affecté à" updateDemand={updateDemand} type="text" width={125} />
      ),
      width: '150px',
      enableSorting: false,
      filterType: 'Facets',
    },
  ];
}

const quickFilterPresets = {
  all: {
    label: 'demandes totales',
    filters: [],
  },
  demandesATraiter: {
    label: (
      <>
        demandes à traiter&nbsp;
        <Tooltip title={<>Prospect non recontacté et statut en attente de prise en charge</>} />
      </>
    ),
    filters: [
      { id: 'Status', value: { 'en attente de prise en charge': false } },
      { id: 'Prise de contact', value: { true: false, false: true } },
    ],
  },
  demandesAHautPotentiel: {
    label: (
      <>
        demandes à haut potentiel&nbsp;
        <Tooltip
          title={
            <>
              Comptabilise les demandes en chauffage collectif soit : à -100m hors paris / -60m paris, soit +100 logements, soit tertiaire.
            </>
          }
        />
      </>
    ),
    filters: [{ id: 'haut_potentiel', value: { true: true, false: false } }],
  },
  demandesDansPDP: {
    label: (
      <>
        demandes en PDP&nbsp;
        <Tooltip
          title={
            <>
              Une obligation de raccordement peut s'appliquer.{' '}
              <Link href="/ressources/obligations-raccordement#contenu" isExternal>
                En savoir plus
              </Link>
            </>
          }
        />
      </>
    ),
    filters: [
      {
        id: 'en PDP',
        value: { true: true, false: false },
      },
    ],
  },
} satisfies Record<string, QuickFilterPreset<Demand>>;
type QuickFilterPresetKey = keyof typeof quickFilterPresets;

function DemandesNew(): React.ReactElement {
  const queryClient = useQueryClient();
  const mapRef = useRef<MapRef>(null) as RefObject<MapRef>;

  const [selectedRows, setSelectedRows] = useState<Demand[]>([]);

  const [mapCollapsed, setMapCollapsed] = useState(false);
  // const [mapPins, setMapPins] = useState<MapMarkerInfos[]>([]);
  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: demands = [], isLoading } = useFetch<Demand[]>('/api/demands');

  const presetStats: Record<QuickFilterPresetKey, number> = {
    all: demands.length,
    demandesATraiter: demands.filter(
      (demand) => demand.Status !== '' && demand.Status !== 'En attente de prise en charge' && !demand['Prise de contact']
    ).length,
    demandesAHautPotentiel: demands.filter((demand) => demand.haut_potentiel).length,
    demandesDansPDP: demands.filter((demand) => demand['en PDP']).length,
  };

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

  const updateDemand = useCallback(async (demandId: string, demandUpdate: Partial<Demand>) => {
    await putFetchJSON(`/api/demands/${demandId}`, demandUpdate);

    queryClient.setQueryData<Demand[]>(['/api/demands'], (demands) =>
      (demands ?? []).map((demand) => {
        if (demand.id === demandId) {
          // on mute directement l'objet et on ne recrée pas un nouveau tableau demands pour ne pas réinitialiser la pagination de la datagrid
          // les anciennes propriétés doivent être supprimées car l'API Airtable ne renvoie pas les propriétés vides
          Object.keys(demand).forEach((key) => {
            delete demand[key as keyof Demand];
          });
          Object.assign(demand, demandUpdate);
        }
        return demand;
      })
    );
  }, []);

  const tableColumns = useMemo(() => getDemandsTableColumns(updateDemand), [updateDemand]);

  const onTableSelectionChange = useCallback((selectedRows: Demand[]) => {
    console.log('onSelectionChange', selectedRows);
    setSelectedRows(selectedRows);
    if (selectedRows.length === 1) {
      const selectedDemand = selectedRows[0];
      // highlightPin(selectedDemand.id);
      setMapCenterLocation({
        center: [selectedDemand.Longitude, selectedDemand.Latitude],
        zoom: 16,
      });
    }
  }, []);

  const toggleFilterPreset = (presetKey: QuickFilterPresetKey) => {
    const preset = quickFilterPresets[presetKey];
    setColumnFilters(isPresetActive(presetKey) ? [] : preset.filters);
  };

  const isPresetActive = (presetKey: QuickFilterPresetKey) => {
    const preset = quickFilterPresets[presetKey];
    if (preset.filters.length === 0) {
      return columnFilters.length === 0;
    }

    // Check if all filters in the preset are active
    return (
      preset.filters.every((presetFilter) =>
        columnFilters.some((activeFilter) => activeFilter.id === presetFilter.id && activeFilter.value === presetFilter.value)
      ) && columnFilters.length === preset.filters.length
    );
  };

  console.log('render demandes-new');
  return (
    <SimplePage
      title="Suivi des demandes"
      description="Votre tableau de bord pour la gestion des demandes des réseaux de chaleur"
      mode="authenticated"
    >
      <div className="mb-8">
        <div className="flex items-center">
          {ObjectEntries(quickFilterPresets).map(([key, preset], index) => (
            <Fragment key={key}>
              <Indicator
                loading={isLoading}
                label={preset.label}
                value={presetStats[key]}
                onClick={() => toggleFilterPreset(key)}
                active={isPresetActive(key)}
              />
              {index < Object.keys(quickFilterPresets).length - 1 && <Divider />}
            </Fragment>
          ))}
        </div>
        {demands.length > 0 && isDefined(mapCenterLocation) ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className={`${mapCollapsed ? 'lg:col-span-5' : 'lg:col-span-3'} overflow-auto`}>
              <TableSimple
                columns={tableColumns}
                data={demands}
                loading={isLoading}
                fluid={true}
                controlsLayout="block"
                onSelectionChange={onTableSelectionChange}
                initialSortingState={[{ id: 'Date demandes', desc: true }]}
              />
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

// TODO harmoniser avec indicator de ProEligibilityTestItem et en faire un composant ?
type IndicatorProps = {
  label: React.ReactNode;
  value: number;
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
};
const Indicator = ({ label, value, loading, onClick, active }: IndicatorProps) => {
  const Element = onClick ? 'button' : 'div';
  return (
    <Element
      className={`fr-p-2w flex flex-col h-full transition-colors ${active ? 'text-blue' : ''} ${onClick ? 'cursor-pointer hover:bg-gray-100 text-left' : ''}`}
      onClick={onClick}
      title={onClick ? 'Cliquer pour filtrer' : undefined}
    >
      <div className="font-bold text-xl">{loading ? <Loader size="sm" className="my-[6px]" /> : value}</div>
      <div>{label}</div>
    </Element>
  );
};

const Divider = () => <div className="h-12 w-px bg-gray-300" />;
