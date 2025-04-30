import { useQueryClient } from '@tanstack/react-query';
import { type ColumnFiltersState } from '@tanstack/react-table';
import { type Virtualizer } from '@tanstack/react-virtual';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type RefObject } from 'react';
import { type MapGeoJSONFeature, type MapRef } from 'react-map-gl/maplibre';

import Input from '@/components/form/dsfr/Input';
import AdditionalInformation from '@/components/Manager/AdditionalInformation';
import Comment from '@/components/Manager/Comment';
import Contact from '@/components/Manager/Contact';
import Contacted from '@/components/Manager/Contacted';
import DemandStatusBadge from '@/components/Manager/DemandStatusBadge';
import Status from '@/components/Manager/Status';
import Tag from '@/components/Manager/Tag';
import { type AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import { VerticalDivider } from '@/components/ui/Divider';
import Icon from '@/components/ui/Icon';
import Indicator from '@/components/ui/Indicator';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/TableSimple';
import Tooltip from '@/components/ui/Tooltip';
import { useFetch } from '@/hooks/useApi';
import { withAuthentication } from '@/server/authentication';
import { DEMANDE_STATUS, type DemandStatus } from '@/types/enum/DemandSatus';
import { type Point } from '@/types/Point';
import { type Demand } from '@/types/Summary/Demand';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { putFetchJSON } from '@/utils/network';
import { upperCaseFirstChar } from '@/utils/strings';
import { ObjectEntries, ObjectKeys } from '@/utils/typescript';

type MapCenterLocation = {
  center: Point;
  zoom: number;
  flyTo?: boolean;
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
      id: 'indicators',
      header: '',
      align: 'center',
      cell: ({ row }) => (
        <>
          {row.original.Status === DEMANDE_STATUS.EMPTY && !row.original['Prise de contact'] && (
            <Tooltip
              iconProps={{
                className: 'ml-1',
                name: 'ri-information-fill',
                size: 'sm',
              }}
              title="Comptabilise les demandes en chauffage collectif à moins de 100m d’un réseau (moins de 60m sur Paris), ou à plus de 100 logements, ou tertiaires."
            >
              <Icon name="fr-icon-flag-fill" size="sm" title={DEMANDE_STATUS.EMPTY} color="blue" className="cursor-help" />
            </Tooltip>
          )}
        </>
      ),
      width: '70px',
    },
    {
      accessorKey: 'Status',
      header: 'Statut',
      cell: ({ row }) => <Status demand={row.original} updateDemand={updateDemand} />,
      width: '300px',
      filterType: 'Facets',
      filterProps: {
        Component: ({ value }) => <DemandStatusBadge status={value as DemandStatus} />,
      },
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'Prise de contact',
      header: 'Prospect recontacté',
      cell: ({ row }) => <Contacted demand={row.original} updateDemand={updateDemand} />,
      align: 'center',
      filterType: 'Facets',
      width: '90px',
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'haut_potentiel',
      header: () => (
        <div className="flex items-center">
          Haut potentiel
          <Tooltip
            iconProps={{
              className: 'ml-1',
              name: 'ri-information-fill',
              size: 'sm',
            }}
            title="Comptabilise les demandes en chauffage collectif à moins de 100m d’un réseau (moins de 60m sur Paris), ou à plus de 100 logements, ou tertiaires."
          />
        </div>
      ),
      cellType: 'Boolean',
      align: 'center',
      width: '100px',
      filterType: 'Facets',
    },
    {
      accessorFn: (row) => `${row.Nom} ${row.Prénom} ${row.Mail}`,
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
      width: '220px',
      enableSorting: false,
    },
    {
      accessorKey: 'Date de la demande',
      header: 'Date de la demande',
      cellType: 'Date',
      width: '110px',
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'Structure',
      header: 'Type',
      cell: ({ row }) => <Tag text={row.original.Structure} />,
      width: '150px',
      filterType: 'Facets',
      enableGlobalFilter: false,
    },
    {
      // accessorKey: 'Mode de chauffage',
      accessorFn: (row) => displayModeDeChauffage(row),
      header: 'Mode de chauffage',
      cell: ({ row }) => <Tag text={displayModeDeChauffage(row.original)} />,
      width: '135px',
      filterType: 'Facets',
      enableGlobalFilter: false,
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
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'Identifiant réseau',
      header: 'ID réseau le plus proche',
      width: '85px',
      filterType: 'Facets',
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
      enableGlobalFilter: false,
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
      enableGlobalFilter: false,
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
      enableGlobalFilter: false,
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

    // obligatoire afin d'être utilisables dans les presets
    {
      accessorKey: 'en PDP',
      filterType: 'Facets', // obligatoire pour faire fonctionner le filtre
      visible: false,
    },
  ];
}

const quickFilterPresets = {
  all: {
    label: 'demandes totales',
    getStat: (demands) => demands.length,
    filters: [],
  },
  demandesATraiter: {
    label: (
      <>
        demandes à traiter&nbsp;
        <Tooltip title={<>Prospect non recontacté et statut en attente de prise en charge</>} />
      </>
    ),
    valueSuffix: <Icon name="fr-icon-flag-fill" size="sm" />,
    getStat: (demands) =>
      demands.filter((demand) => demand.Status === 'En attente de prise en charge' && !demand['Prise de contact']).length,
    filters: [
      { id: 'Status', value: { 'En attente de prise en charge': true } },
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
              Comptabilise les demandes en chauffage collectif à moins de 100m d’un réseau (moins de 60m sur Paris), ou à plus de 100
              logements, ou tertiaires.
            </>
          }
        />
      </>
    ),
    getStat: (demands) => demands.filter((demand) => demand.haut_potentiel).length,
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
    getStat: (demands) => demands.filter((demand) => demand['en PDP'] === 'Oui').length,
    filters: [
      {
        id: 'en PDP',
        value: { Oui: true, Non: false },
      },
    ],
  },
} satisfies Record<string, QuickFilterPreset<Demand>>;
type QuickFilterPresetKey = keyof typeof quickFilterPresets;

const initialSortingState = [{ id: 'Date de la demande', desc: true }];

function DemandesNew(): React.ReactElement {
  const queryClient = useQueryClient();
  const mapRef = useRef<MapRef>(null) as RefObject<MapRef>;
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>(null) as RefObject<Virtualizer<HTMLDivElement, Element>>;

  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);

  const tableRowSelection = useMemo(() => {
    return selectedDemandId ? { [selectedDemandId]: true } : {};
  }, [selectedDemandId]);

  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);

  const { data: demands = [], isLoading } = useFetch<Demand[]>('/api/demands');

  const presetStats = ObjectKeys(quickFilterPresets).reduce(
    (acc, key) => ({
      ...acc,
      [key]: quickFilterPresets[key].getStat(demands),
    }),
    {} as Record<QuickFilterPresetKey, number>
  );

  // reset selection when filters change
  useEffect(() => {
    setSelectedDemandId(null);
  }, [filteredDemands]);

  const filteredDemandsMapData = useMemo(() => {
    return filteredDemands.map(
      (demand) =>
        ({
          id: demand.id,
          longitude: demand.Longitude,
          latitude: demand.Latitude,
          address: demand.Adresse,
          selected: demand.id === selectedDemandId,
          // isEligible: demand.haut_potentiel,
        }) satisfies AdresseEligible
    );
  }, [filteredDemands, selectedDemandId]);

  const updateDemand = useCallback(async (demandId: string, demandUpdate: Partial<Demand>) => {
    await putFetchJSON(`/api/demands/${demandId}`, demandUpdate);

    queryClient.setQueryData<Demand[]>(['/api/demands'], (demands) =>
      (demands ?? []).map((demand) => {
        if (demand.id === demandId) {
          return { ...demand, ...demandUpdate };
        }
        return demand;
      })
    );
  }, []);

  const tableColumns = useMemo(() => getDemandsTableColumns(updateDemand), [updateDemand]);

  const onFeatureClick = useCallback(
    (feature: MapGeoJSONFeature) => {
      if (feature.source !== 'adressesEligibles') {
        return;
      }
      setSelectedDemandId(feature.id as string);
      const rowIndex = filteredDemands.findIndex((demand) => demand.id === feature.id);
      virtualizerRef.current?.scrollToIndex(rowIndex, { align: 'center' });
    },
    [filteredDemands, virtualizerRef.current]
  );

  const onTableRowClick = useCallback(
    (demandId: string) => {
      setSelectedDemandId(demandId);
      const selectedDemand = demands.find((demand) => demand.id === demandId);
      if (selectedDemand) {
        setMapCenterLocation({
          center: [selectedDemand.Longitude, selectedDemand.Latitude],
          zoom: 16,
          flyTo: true,
        });
      }
    },
    [demands]
  );

  const onTableFiltersChange = useCallback((demands: Demand[]) => {
    setFilteredDemands(demands);

    // center on the first demand if any
    const firstDemand = demands[0];
    if (firstDemand) {
      setMapCenterLocation({
        center: [firstDemand.Longitude, firstDemand.Latitude],
        zoom: 8,
        flyTo: true,
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

  return (
    <SimplePage
      title="Suivi des demandes"
      description="Votre tableau de bord pour la gestion des demandes des réseaux de chaleur"
      mode="authenticated"
    >
      <div className="mb-8">
        <div className="flex items-center flex-wrap">
          <Input
            label=""
            nativeInputProps={{
              'aria-label': 'rechercher',
              required: true,
              placeholder: 'Rechercher par nom, email, adresse...',
              value: globalFilter,
              onChange: (e) => setGlobalFilter(e.target.value),
            }}
            className="p-2w !mb-0 w-[350px]"
          />
          {ObjectEntries(quickFilterPresets).map(([key, preset], index) => (
            <Fragment key={key}>
              <Indicator
                loading={isLoading}
                label={preset.label}
                value={presetStats[key]}
                valueSuffix={'valueSuffix' in preset ? preset.valueSuffix : null}
                onClick={() => toggleFilterPreset(key)}
                active={isPresetActive(key)}
              />
              {index < Object.keys(quickFilterPresets).length - 1 && <VerticalDivider className="hidden md:block" />}
            </Fragment>
          ))}
        </div>
        <ResizablePanelGroup direction="horizontal" className="gap-4">
          <ResizablePanel defaultSize={66}>
            <TableSimple
              columns={tableColumns}
              data={demands}
              loading={isLoading}
              initialSortingState={initialSortingState}
              globalFilter={globalFilter}
              columnFilters={columnFilters}
              onFilterChange={onTableFiltersChange}
              fluid
              controlsLayout="block"
              padding="sm"
              rowSelection={tableRowSelection}
              onRowClick={onTableRowClick}
              loadingEmptyMessage="Vous n'avez pas encore reçu de demandes"
              height="calc(100dvh - 140px)"
              virtualizerRef={virtualizerRef}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={34}>
            <div className={cx('max-md:h-[600px] md:h-[calc(100dvh-140px)] bg-[#F8F4F0]')}>
              {isDefined(mapCenterLocation) ? (
                <Map
                  noPopup
                  withoutLogo
                  initialCenter={mapCenterLocation.center}
                  initialZoom={mapCenterLocation.zoom}
                  enableFlyToCentering
                  initialMapConfiguration={createMapConfiguration({
                    reseauxDeChaleur: {
                      show: true,
                    },
                    reseauxEnConstruction: true,
                    zonesDeDeveloppementPrioritaire: true,
                  })}
                  geolocDisabled
                  mapRef={mapRef}
                  withSoughtAddresses={false}
                  adressesEligibles={filteredDemandsMapData}
                  adressesEligiblesAutoFit={false}
                  onFeatureClick={onFeatureClick}
                />
              ) : (
                <div className="absolute inset-0 flex justify-center items-center animate-pulse">
                  <Loader size="lg" />
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SimplePage>
  );
}

export default DemandesNew;

export const getServerSideProps = withAuthentication(['gestionnaire', 'demo']);
